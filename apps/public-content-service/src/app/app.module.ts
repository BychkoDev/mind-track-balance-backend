import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@app/common';
import { JwtStrategyModule } from '@app/common/strategy/jwt-stratedy.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    // HttpModule,
    CommonModule,
    JwtStrategyModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? 'apps/public-content-service/.env.prod'
          : 'apps/public-content-service/.env.dev',
      // envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
    }),
  ],
})
export class AppModule {}
