import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@app/common';
// import {HttpModule} from "@nestjs/axios";
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/common/strategy/jwt.strategy';
import { JwtStrategyModule } from '@app/common/strategy/jwt-stratedy.module';

@Module({
  imports: [
    PassportModule,
    // HttpModule, // Надає HttpService для ін'єкції
    CommonModule,
    JwtStrategyModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? 'apps/user-service/.env.prod'
          : 'apps/user-service/.env.dev',
    }),
  ],
  providers: [
    JwtStrategy, // Реєструємо нашу локальну стратегію як провайдер
  ],
})
export class AppModule {}
