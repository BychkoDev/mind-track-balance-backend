import { Module } from '@nestjs/common';

import { MindTrackController } from './mind-track.controller';
import { MindTrackService } from './mind-track.service';
import { MindTrackRepository } from './mind-track.repository';
import { MindTrackAdviceRepository } from './mind-track-advice.repository';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [MindTrackController],
  providers: [MindTrackService, MindTrackRepository, MindTrackAdviceRepository],
  exports: [MindTrackService, MindTrackRepository, MindTrackAdviceRepository],
})
export class MindTrackModule {}
