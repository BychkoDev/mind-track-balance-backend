import { Module } from '@nestjs/common';
import { MediaPrismaService } from './prisma.service';

@Module({
  providers: [MediaPrismaService],
  exports: [MediaPrismaService],
})
export class MediaPrismaModule {}
