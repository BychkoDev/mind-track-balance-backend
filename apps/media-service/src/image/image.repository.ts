import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';

@Injectable()
export class ImageRepository {
  constructor(private readonly prisma: PrismaService) {}
}
