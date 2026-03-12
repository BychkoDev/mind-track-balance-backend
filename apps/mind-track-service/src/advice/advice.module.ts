import { Module } from '@nestjs/common';
import { AdviceController } from './advice.controller';
import { AdviceService } from './advice.service';
import { AdviceRepository } from './advice.repository';
import { AdviceCronService } from './advice.cron.service';
import { MindTrackModule } from '../mind-track/mind-track.module';
import { AiModule } from '../ai/ai.module';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule, AiModule, MindTrackModule],
  controllers: [AdviceController],
  providers: [AdviceService, AdviceRepository, AdviceCronService],
  exports: [AdviceService],
})
export class AdviceModule {}
