import { Controller, Get, Query } from '@nestjs/common';
import { PageService } from './page.service';

@Controller('/api/v1/pages')
export class PageController {
  constructor(private readonly service: PageService) {}

  @Get()
  async getPage(@Query('url') url: string, @Query('locale') locale?: string) {
    return this.service.getPageByUrl(url, locale);
  }
}
