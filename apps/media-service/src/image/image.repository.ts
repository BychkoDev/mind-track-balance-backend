import { Injectable } from '@nestjs/common';
import { Prisma, MediaImage, MediaPrismaService } from '@app/prisma-media';

@Injectable()
export class ImageRepository {
  constructor(private readonly prisma: MediaPrismaService) {}

  async createImage(data: Prisma.MediaImageCreateInput): Promise<MediaImage> {
    return this.prisma.mediaImage.create({
      data,
    });
  }

  async findImageByUuid(uuid: string): Promise<MediaImage | null> {
    return this.prisma.mediaImage.findUnique({
      where: { uuid },
    });
  }
}
