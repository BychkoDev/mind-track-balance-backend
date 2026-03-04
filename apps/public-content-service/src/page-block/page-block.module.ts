import { Module } from '@nestjs/common';
import { PageBlockRepository } from './page-block.repository';
import { PageBlockService } from './page-block.service';
import { PageBlockController } from './page-block.controller';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  providers: [PageBlockService, PageBlockRepository],
  controllers: [PageBlockController],
  exports: [BlockPagesModule],
})
export class BlockPagesModule {}
