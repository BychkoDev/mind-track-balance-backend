import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthUserService } from '../auth-user/auth-user.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtTokensDto } from './dto/jwt-tokens.dto';
import { AuthUser } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';

export interface TokenPayload {
  sub: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly authUserService: AuthUserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

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
    
    await this.authUserService.upsertRefreshToken(user.uuid, {
      deletionTime: deletionTime,
      deviceId: loginDto.deviceId,
      jwtRefreshToken: await this._hashJwtRefreshToken(tokens.refreshToken),
    });

    return tokens;
  }

  /**
   * Вихід з системи: видалення refresh токена з бази.
   */
  async logout(userUuid: string): Promise<void> {
    await this.authUserService.upsertRefreshToken(userUuid, {
      jwtRefreshToken: null,
      deletionTime: new Date(),
    });
  }

  /**
   * Оновлення пари токенів за допомогою refresh токена.
   */
  async refreshTokens(refreshToken: string): Promise<JwtTokensDto> {
    try {
      const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: refreshTokenSecret,
      });
      const userUuid = payload.sub;

      const user = await this.authUserService.findUserByUuid(userUuid);
      if (!user || !user.jwtRefreshToken?.jwtRefreshToken) {
        throw new ForbiddenException('Доступ заборонено (відсутній токен)');
      }

      const isRefreshTokenMatching = await bcrypt.compare(
        refreshToken,
        user.jwtRefreshToken.jwtRefreshToken,
      );

      if (!isRefreshTokenMatching) {
        throw new ForbiddenException('Доступ заборонено');
      }

      if (!user.active) {
        throw new ForbiddenException('Акаунт не активовано');
      }

      const tokens = await this._createTokens(user);
      const deletionTime = new Date();
      deletionTime.setDate(deletionTime.getDate() + 7);

      await this.authUserService.upsertRefreshToken(user.uuid, {
        jwtRefreshToken: await this._hashJwtRefreshToken(tokens.refreshToken),
        deletionTime,
      });

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
    const expiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        algorithm: 'RS256',
        expiresIn: expiration,
        audience: ['user-service', 'notification-service'], // можна масив
        issuer: 'auth-service',
      }),
      this.jwtService.signAsync(
        { sub: user.uuid },
        {
          secret: refreshTokenSecret,
          algorithm: 'HS256',
          expiresIn: expiration,
        },
      ),
    ]);

    return new JwtTokensDto(accessToken, refreshToken);
  }

  private async _hashJwtRefreshToken(refreshToken: string): Promise<string> {
    return await bcrypt.hash(refreshToken, this.saltRounds);
  }
}
