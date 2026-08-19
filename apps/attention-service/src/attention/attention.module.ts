import { Module } from '@nestjs/common';
import { AttentionController } from './attention.controller';
import { AttentionService } from './attention.service';
import { AttentionPrismaModule } from '@app/prisma-attention';

@Module({
  imports: [AttentionPrismaModule],
  controllers: [AttentionController],
  providers: [AttentionService],
})
export class AttentionModule {}
