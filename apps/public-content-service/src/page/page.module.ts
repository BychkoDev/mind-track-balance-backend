import { Module } from '@nestjs/common';
import { PageRepository } from './page.repository';
import { PageController } from './page.controller';
import { PageService } from './page.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [],
  providers: [PageService, PageRepository],
  controllers: [PageController],
  exports: [PageService, PageRepository],
})
export class PageModule {}
