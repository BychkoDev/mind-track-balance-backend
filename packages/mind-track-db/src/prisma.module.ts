import { Global, Module } from '@nestjs/common';
import { MindTrackPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [MindTrackPrismaService],
  exports: [MindTrackPrismaService],
})
export class MindTrackPrismaModule {}