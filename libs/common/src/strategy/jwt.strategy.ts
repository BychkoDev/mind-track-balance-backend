import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  
  constructor(private readonly configService: ConfigService) {
    const jwksClient = new JwksClient({
      jwksUri: configService.getOrThrow<string>('JWKS_URI'),
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 86400000,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        const decodedToken = jwt.decode(rawJwtToken, { complete: true });
        if (!decodedToken || typeof decodedToken !== 'object') {
          return done(new Error('Invalid token format'), 'null');
        }

        const kid = decodedToken.header.kid;

        if (!kid) {
          console.error('JwtStrategy: Invalid token: missing key ID (kid) in header');
          return done(new Error('Invalid token: missing key ID (kid) in header'), 'null');
        }

        jwksClient.getSigningKey(kid, (err, key) => {
          if (err) {
            console.error('JwtStrategy: jwksClient.getSigningKey error:', err);
            return done(err);
          }
          const signingKey = key?.getPublicKey();
          done(null, signingKey);
        });
      },
    });
  }

  async validate(payload: any) {
    const expectedIssuer = this.configService.get<string>('JWT_ISSUER');
    const expectedAudiences = (this.configService.get<string>('JWT_AUDIENCE') || '').split(',').map(aud => aud.trim());

    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    const tokenAud = payload.aud;
    const isAudienceValid = Array.isArray(tokenAud)
      ? tokenAud.some(a => expectedAudiences.includes(a))
      : expectedAudiences.includes(tokenAud);

    if (!isAudienceValid) {
      throw new UnauthorizedException('Invalid token audience');
    }

    return {
      sub: payload.sub,
      role: payload.role,
    };
  }
}
