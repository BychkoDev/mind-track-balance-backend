import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { CommonModule } from '@app/common';
import { JwtStrategyModule } from '@app/common/strategy/jwt-stratedy.module';
import { MindTrackModule } from '../mind-track/mind-track.module';
import { AiModule } from '../ai/ai.module';
import { AdviceModule } from '../advice/advice.module';
import { WeeklyReportModule } from '../weekly-report/weekly-report.module';
import { ScheduleModule } from '@nestjs/schedule';
import { MindTrackPrismaModule } from '@app/prisma-mind-track';
import { join } from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PassportModule,
    CommonModule,
    JwtStrategyModule,
    MindTrackModule,
    AiModule,
    AdviceModule,
    WeeklyReportModule,
    MindTrackPrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production' ? join(process.cwd(), '.env.prod') : join(process.cwd(), '.env.dev'),
    }),
  ],
})
export class AppModule {}
