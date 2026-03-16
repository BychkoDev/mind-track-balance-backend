import { Injectable, NotFoundException } from '@nestjs/common';
import { PageRepository } from './page.repository';

@Injectable()
export class PageService {
  constructor(private readonly repository: PageRepository) {}

  async getPageByUrl(url: string, locale: string = 'en') {
    const page = await this.repository.findPageByUrl(url, locale);
    if (!page) {
      throw new NotFoundException(`Page with URL ${url} and locale ${locale} not found`);
    }
    return page;
  }
}
