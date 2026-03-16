import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { S3StorageService } from '../s3-storage/s3-storage.service';
import { ImageRepository } from './image.repository';
import { MediaImage } from '@app/prisma-media';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly s3Storage: S3StorageService,
    private readonly repository: ImageRepository,
  ) {}

  async uploadWebImage(file: Express.Multer.File, bucket: string, prefix?: string): Promise<MediaImage> {
    const imageUuid = uuidv4();

    const uploadResult = await this.s3Storage.saveImage(bucket, {
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      prefix: prefix ? `${prefix}/orig` : 'orig',
    });

    const image = await this.repository.createImage({
      uuid: imageUuid,
      imageName: file.originalname,
      bucket: bucket,
      previewImageName: uploadResult.key,
    });

    return image;
  }

  async getImageUrl(uuid: string): Promise<string> {
    const image = await this.repository.findImageByUuid(uuid);
    if (!image) throw new NotFoundException('Image not found');

    return this.s3Storage.getImageUrl(image.bucket, image.previewImageName || image.imageName);
  }

  private mapMimeToFormat(mime: string): ImageFormat {
    if (mime.includes('png')) return ImageFormat.png;
    if (mime.includes('webp')) return ImageFormat.webp;
    if (mime.includes('svg')) return ImageFormat.svg;
    return ImageFormat.jpeg;
  }
}
