import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';

@Injectable()
export class SeoObjectRepository {
  constructor(private readonly prisma: PrismaService) {}
}
