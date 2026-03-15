import { Injectable } from '@nestjs/common';

@Injectable()
export class SeoObjectService {
  // private readonly saltRounds = 12;
  //
  constructor() {}
  //
  //
  // async login(loginDto: LoginDto): Promise<JwtTokensDto> {
  //     const user = await this.authUserService.validateUser(loginDto.email, loginDto.password);
  //     const deletionTime = new Date();
  //     deletionTime.setDate(deletionTime.getDate() + 7);
  //     const tokens = await this._createTokens(user);
  //     user.jwtRefreshToken.deletionTime = deletionTime;
  //     user.jwtRefreshToken.deviceFingerprinting = loginDto.deviceFingerprinting;
  //     user.jwtRefreshToken.jwtRefreshToken = await this._hashJwtRefreshToken(tokens.refreshToken);
  //     await this.authUserService.saveUser(user);
  //     return tokens;
  // }


  // async logout(userId: number): Promise<void> {
  //     await this.authUserService.updateRefreshToken(userId, null);
  // }


  // async refreshTokens(userId: number, refreshToken: string): Promise<JwtTokensDto> {
  //     const user = await this.authUserService.findUserById(userId);
  //     if (!user || !user.hashedRefreshToken) {
  //         throw new ForbiddenException('Доступ заборонено');
  //     }
  //
  //     // 1. Перевіряємо, чи наданий токен відповідає тому, що в базі
  //     const isRefreshTokenMatching = await bcrypt.compare(
  //         refreshToken,
  //         user.hashedRefreshToken,
  //     );
  //
  //     if (!isRefreshTokenMatching) {
  //         throw new ForbiddenException('Доступ заборонено');
  //     }
  //
  //     // 2. Якщо все добре, випускаємо нову пару токенів
  //     const tokens = await this._createTokens(user);
  //     // 3. Оновлюємо хеш в базі
  //     await this.authUserService.updateRefreshToken(user.id, tokens.refreshToken);
  //
  //     return tokens;
  // }

  // private async _createTokens(user: AuthUser): Promise<JwtTokensDto> {
  //     const payload: TokenPayload = {
  //         sub: user.id,
  //         role: user.role,
  //     };
  //
  //     const refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
  //     if (!refreshTokenSecret) {
  //         throw new Error('JWT_REFRESH_SECRET is missing in the environment configuration!');
  //     }
  //     const expiration = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');
  //     const [accessToken, refreshToken] = await Promise.all([
  //         this.jwtService.signAsync(payload, {
  //             algorithm: 'RS256',
  //             expiresIn: expiration,
  //             audience: ['user-service', 'notification-service'], // можна масив
  //             issuer: 'auth-service',
  //         }),
  //         this.jwtService.signAsync(
  //             { sub: user.id },
  //             {
  //                 secret: refreshTokenSecret,
  //                 algorithm: 'HS256',
  //                 expiresIn: expiration,
  //             },
  //         ),
  //     ]);
  //
  //     return (new JwtTokensDto(accessToken, refreshToken));
  // }
  //
  // private async  _hashJwtRefreshToken(refreshToken: string): Promise<string> {
  //     return  await bcrypt.hash(refreshToken, this.saltRounds);
  // }
}
