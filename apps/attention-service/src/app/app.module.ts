import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AttentionModule } from '../attention/attention.module';
import { CommonModule } from '@app/common';
import { JwtStrategyModule } from '@app/common/strategy/jwt-stratedy.module';
import { AttentionPrismaModule } from '@app/prisma-attention';
import { join } from 'path';

@Module({
  imports: [
    PassportModule,
    CommonModule,
    JwtStrategyModule,
    AttentionPrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? join(process.cwd(), '.env.prod') : join(process.cwd(), '.env.dev'),
    }),
    AttentionModule,
  ],
})
export class AppModule {}
