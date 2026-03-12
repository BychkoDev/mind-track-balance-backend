import { Module } from '@nestjs/common';

import { MindTrackController } from './mind-track.controller';
import { MindTrackService } from './mind-track.service';
import { MindTrackRepository } from './mind-track.repository';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [MindTrackController],
  providers: [MindTrackService, MindTrackRepository],
  exports: [MindTrackService, MindTrackRepository],
})
export class MindTrackModule {}
