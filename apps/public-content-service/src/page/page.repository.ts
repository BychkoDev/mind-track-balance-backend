import { Injectable } from '@nestjs/common';
import { Page, PageBlock, Image, ImageVariant, Prisma, ContentPrismaService } from '@app/prisma-content';

@Injectable()
export class PageRepository {
  constructor(private readonly prisma: ContentPrismaService) {}

  async findPageByUrl(url: string, locale: string): Promise<any | null> {
    return this.prisma.page.findFirst({
      where: {
        url,
      },
      include: {
        blocks: {
          include: {
            translations: {
              where: { locale: locale as any },
            },
            images: {
              include: {
                variants: true,
              },
            },
          },
        },
        seoObjectTranslation: {
          where: { locale: locale as any },
        },
      },
    });
  }

  async createPage(data: Prisma.PageCreateInput): Promise<Page> {
    return this.prisma.page.create({
      data,
    });
  }
}
