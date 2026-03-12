import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { JwtAuthStrategy } from '../strategy/jwtAuth.startegy';
import { RsaKeyModule } from '../rsa-key/rsa-key.module';
import { AuthUserModule } from '../auth-user/auth-user.module';
import { RsaKeyService } from '../rsa-key/rsa-key.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    RsaKeyModule,
    AuthUserModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        const password = configService.get<string>('REDIS_PASSWORD', '');
        const url = password ? `redis://:${password}@${host}:${port}` : `redis://${host}:${port}`;
        return {
          stores: [createKeyv(url)],
        };
      },
    }),
    JwtModule.registerAsync({
      imports: [RsaKeyModule],
      inject: [RsaKeyService, ConfigService],
      useFactory: async (
        keyService: RsaKeyService,
        configService: ConfigService,
      ) => {
        await keyService.onModuleInit();
        return {
          privateKey: keyService.getPrivateKey(),
          publicKey: keyService.getPublicKey(),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: configService.get<string>(
              'JWT_ACCESS_EXPIRATION',
              '15m',
            ),
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthStrategy],
  exports: [AuthService],
})
export class AuthModule {}
