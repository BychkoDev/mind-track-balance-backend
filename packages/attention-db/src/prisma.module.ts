import { Global, Module } from '@nestjs/common';
import { AttentionPrismaService } from './prisma.service';

@Global()
@Module({
  providers: [AttentionPrismaService],
  exports: [AttentionPrismaService],
})
export class AttentionPrismaModule {}
