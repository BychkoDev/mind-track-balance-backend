import { Module } from '@nestjs/common';
import { WeeklyReportController } from './weekly-report.controller';
import { WeeklyReportService } from './weekly-report.service';
import { WeeklyReportRepository } from './weekly-report.repository';
import { WeeklyReportCronService } from './weekly-report.cron.service';
import { AiModule } from '../ai/ai.module';
import { MindTrackModule } from '../mind-track/mind-track.module';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    AiModule,
    MindTrackModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'mind-track-service-client',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
          consumer: {
            groupId: 'mind-track-weekly-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [WeeklyReportController],
  providers: [WeeklyReportService, WeeklyReportRepository, WeeklyReportCronService],
  exports: [WeeklyReportService],
})
export class WeeklyReportModule {}
