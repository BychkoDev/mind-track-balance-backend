import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthUserService } from '../auth-user/auth-user.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtTokensDto } from './dto/jwt-tokens.dto';
import { AuthUser } from '@app/prisma-auth';
import { ForbiddenException, Inject, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

export interface TokenPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly saltRounds = 12;

  constructor(
    private readonly authUserService: AuthUserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async onModuleInit() {
    console.log('⏳ Connecting to REDIS...');
    try {
      await this.cacheManager.set('health', 'ok', 5000);
      const val = await this.cacheManager.get('health');
      if (val !== 'ok') throw new Error('Redis value mismatch');
      console.log('✅ REDIS Connected successfully');
    } catch (e) {
      console.error('❌ Failed to connect to REDIS Cache', e);
      throw e;
    }
  }

  async signup(signupDto: SignupDto): Promise<void> {
    return this.authUserService.sighup(signupDto);
  }

  async login(loginDto: LoginDto): Promise<JwtTokensDto> {
    const user = await this.authUserService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    const deletionTime = new Date();
    deletionTime.setDate(deletionTime.getDate() + 7);
    const tokens = await this._createTokens(user);
    const hashrt = await this._hashJwtRefreshToken(tokens.refreshToken);

    // Save to Postgres
    await this.authUserService.upsertRefreshToken(user.uuid, {
      deletionTime: deletionTime,
      deviceId: loginDto.deviceId,
      jwtRefreshToken: hashrt,
    });

    // Save to Redis (ttl in milliseconds, 7 days)
    const ttl = 7 * 24 * 60 * 60 * 1000;
    await this.cacheManager.set(`refresh_token:${user.uuid}`, hashrt, ttl);

    return tokens;
  }

  /**
   * Вихід з системи: видалення refresh токена з бази та кешу.
   */
  async logout(userUuid: string): Promise<void> {
    await this.authUserService.upsertRefreshToken(userUuid, {
      jwtRefreshToken: null,
      deletionTime: new Date(),
    });
    await this.cacheManager.del(`refresh_token:${userUuid}`);
  }

  /**
   * Оновлення пари токенів за допомогою refresh токена.
   */
  async refreshTokens(refreshToken: string): Promise<JwtTokensDto> {
    try {
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshTokenSecret,
      }) as { sub: string };
      const userUuid = payload.sub;

      let storedHash: string | undefined | null = await this.cacheManager.get<string>(`refresh_token:${userUuid}`);

      let user: (AuthUser & { jwtRefreshToken?: { jwtRefreshToken: string | null } }) | null = null;
      if (!storedHash) {
        // Fallback to PostgreSQL
        user = await this.authUserService.findUserByUuid(userUuid) as any;
        if (!user || !user.jwtRefreshToken?.jwtRefreshToken) {
          throw new ForbiddenException('Доступ заборонено (відсутній токен)');
        }
        storedHash = user.jwtRefreshToken.jwtRefreshToken;
      }

      const isRefreshTokenMatching = await bcrypt.compare(
        refreshToken,
        storedHash as string,
      );

      if (!isRefreshTokenMatching) {
        throw new ForbiddenException('Доступ заборонено');
      }

      // Check active status by querying the user if we haven't already
      if (!user) {
        user = await this.authUserService.findUserByUuid(userUuid) as AuthUser;
      }

      if (!user || !user.active) {
        throw new ForbiddenException('Акаунт не активовано або не існує');
      }

      const tokens = await this._createTokens(user);
      const deletionTime = new Date();
      deletionTime.setDate(deletionTime.getDate() + 7);

      const hashrt = await this._hashJwtRefreshToken(tokens.refreshToken);

      await this.authUserService.upsertRefreshToken(user.uuid, {
        jwtRefreshToken: hashrt,
        deletionTime,
      });

      const ttl = 7 * 24 * 60 * 60 * 1000;
      await this.cacheManager.set(`refresh_token:${user.uuid}`, hashrt, ttl);

      return tokens;
    } catch {
      throw new ForbiddenException('Недійсний або прострочений refresh токен');
    }
  }

  private async _createTokens(user: AuthUser): Promise<JwtTokensDto> {
    const payload: TokenPayload = {
      sub: user.uuid,
      role: user.role,
    };

    const refreshTokenSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshTokenSecret) {
      throw new Error(
        'JWT_REFRESH_SECRET is missing in the environment configuration!',
      );
    }
    const refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
    const accessExpiration = this.configService.get<string>(
      'JWT_ACCESS_EXPIRATION',
      '15m',
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as any, {
        algorithm: 'RS256',
        expiresIn: accessExpiration as any,
        audience: ['user-service', 'notification-service'],
        issuer: 'auth-service',
      }),
      this.jwtService.signAsync(
        { sub: user.uuid } as any,
        {
          secret: refreshTokenSecret,
          algorithm: 'HS256',
          expiresIn: refreshExpiration as any,
        },
      ),
    ]);

    return new JwtTokensDto(accessToken, refreshToken);
  }

  private async _hashJwtRefreshToken(refreshToken: string): Promise<string> {
    return await bcrypt.hash(refreshToken, this.saltRounds);
  }
}
