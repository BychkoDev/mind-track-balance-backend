import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';

@Injectable()
export class PageRepository {
  constructor(private readonly prisma: PrismaService) {}
}
