import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    // Крок 1: Ініціалізуємо клієнт JWKS ДО виклику super()
    const jwksClient = new JwksClient({
      jwksUri: configService.getOrThrow<string>('JWKS_URI'), // Використовуємо getOrThrow для надійності
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 86400000, // 1 день
    });

    // Крок 2: Викликаємо super() з провайдером ключа
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      // secretOrKeyProvider - це потужний механізм для динамічного отримання ключа
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        // Декодуємо токен (без перевірки), щоб отримати header і 'kid'
        const decodedToken = jwt.decode(rawJwtToken, { complete: true });
        if (!decodedToken || typeof decodedToken !== 'object') {
          return done(new Error('Invalid token format'), 'null');
        }

        const kid = decodedToken.header.kid;

        if (!kid) {
          return done(
            new Error('Invalid token: missing key ID (kid) in header'),
            'null',
          );
        }

        // Крок 3: Використовуємо клієнт для отримання ключа підпису за 'kid'
        jwksClient.getSigningKey(kid, (err, key) => {
          if (err) {
            // Якщо сталася помилка (напр., ключ не знайдено), передаємо її далі
            return done(err);
          }

          // Крок 4: Отримуємо публічний ключ. Цього методу достатньо.
          const signingKey = key?.getPublicKey();

          // Передаємо ключ у passport-jwt для фінальної валідації
          done(null, signingKey);
        });
      },
    });
  }

  /**
   * Цей метод викликається ПІСЛЯ того, як passport-jwt успішно перевірив
   * підпис та термін дії токена, використовуючи ключ, який ми надали.
   * @param payload - Розшифрований вміст JWT токена.
   */
  async validate(payload: any) {
    const expectedIssuer = this.configService.get<string>('JWT_ISSUER');
    const expectedAudiences = (
      this.configService.get<string>('JWT_AUDIENCE') || ''
    )
      .split(',')
      .map((aud) => aud.trim());

    // Перевірка видавця токена
    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    // Перевірка аудиторії токена
    const tokenAud = payload.aud;
    const isAudienceValid = Array.isArray(tokenAud)
      ? tokenAud.some((a) => expectedAudiences.includes(a))
      : expectedAudiences.includes(tokenAud);

    if (!isAudienceValid) {
      throw new UnauthorizedException('Invalid token audience');
    }

    // Якщо все гаразд — повертаємо частину payload для request.user
    return {
      id: payload.sub,
      role: payload.role,
    };
  }
  // async validate(payload: any) {
  //     // Тут ви повертаєте об'єкт, який буде додано до `request.user`
  //     // Наприклад, повертаємо ID користувача та його роль з токена.
  //     return { id: payload.sub, role: payload.role };
  // }
}

// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { HttpService } from '@nestjs/axios';
// import { ConfigService } from '@nestjs/config';
// import { firstValueFrom } from 'rxjs';
// import { JwksClient } from 'jwks-rsa'; // Більш просунутий варіант з кешуванням
//
// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//     constructor(
//         private readonly httpService: HttpService,
//         private readonly configService: ConfigService,
//     ) {
//         super({
//             jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//             ignoreExpiration: false,
//             // Ми не надаємо ключ напряму, а використовуємо функцію-провайдер
//             secretOrKeyProvider: (request, rawJwtToken, done) => {
//                 // Ця функція буде викликана для отримання ключа
//                 this.getPublicKey()
//                     .then(key => done(null, key))
//                     .catch(err => done(err));
//             },
//         });
//     }
//
//     // Зберігаємо ключ в пам'яті, щоб не робити запит кожного разу
//     private publicKey: string | null = null;
//
//     private async getPublicKey(): Promise<string> {
//         if (this.publicKey) {
//             return this.publicKey;
//         }
//
//         const authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL');
//         if (!authServiceUrl) {
//             throw new Error('AUTH_SERVICE_URL is not defined in environment variables');
//         }
//
//         try {
//             console.log(`Fetching public key from ${authServiceUrl}/auth/public-key`);
//             const response = await firstValueFrom(
//                 this.httpService.get<{ publicKey: string }>(`${authServiceUrl}/auth/public-key`)
//             );
//             this.publicKey = response.data.publicKey;
//             return this.publicKey;
//         } catch (error) {
//             throw new UnauthorizedException('Could not retrieve public key to validate token.');
//         }
//     }
//
//     // Цей метод виконується ПІСЛЯ успішної валідації токена
//     async validate(payload: any) {
//         // payload - це розшифрований вміст токена
//         return { id: payload.sub, role: payload.role };
//     }
// }
