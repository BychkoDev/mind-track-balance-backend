import { Controller, Get } from '@nestjs/common';
import { PageService } from './page.service';

@Controller('/api/v1/page')
export class PageController {
  constructor(private readonly service: PageService) {}

  @Get('/url')
  async getHello() {
    return { message: ' Все працює!' };
  }
}
