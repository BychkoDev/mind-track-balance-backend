import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CommonModule } from '@app/common';
// import {HttpModule} from "@nestjs/axios";
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@app/common/strategy/jwt.strategy';
import { JwtStrategyModule } from '@app/common/strategy/jwt-stratedy.module';
import { UsersPrismaModule } from '@app/prisma-users';
import { join } from 'path';

const envFilePath =
  process.env.NODE_ENV === 'production'
    ? join(process.cwd(), '.env.prod')
    : join(process.cwd(), '.env.dev');

@Module({
  imports: [
    UsersPrismaModule,
    PassportModule,
    // HttpModule,
    CommonModule,
    JwtStrategyModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath
    }),
  ],
  providers: [
    JwtStrategy,
  ],
})
export class AppModule {}
