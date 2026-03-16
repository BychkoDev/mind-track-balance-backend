import { Module } from '@nestjs/common';
import { ContentPrismaService } from './prisma.service';

@Module({
  providers: [ContentPrismaService],
  exports: [ContentPrismaService],
})
export class ContentPrismaModule {}
