import { Injectable, Inject, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export type AllowedImageMime = 'image/png' | 'image/jpeg' | 'image/svg+xml';

export interface SaveImageInput {
  /** сирі байти файлу (наприклад, із Multer memoryStorage) */
  buffer: Buffer;
  /** оригінальна назва, щоб зчитати розширення як запасний варіант */
  originalName?: string;
  /** MIME з заголовків multipart */
  mimeType?: string;
  /** бажана вкладена “папка” (префікс) у бакеті, напр. 'avatars/' */
  prefix?: string;
  /** довільні метадані */
  metadata?: Record<string, string>;
  /** явне розширення, якщо хочеш зафіксувати (без крапки): png | jpg | jpeg | svg */
  forceExt?: 'png' | 'jpg' | 'jpeg' | 'svg';
}

@Injectable()
export class S3StorageService implements OnModuleInit {
  private readonly logger = new Logger(S3StorageService.name);
  private ready = false;

  constructor(
    @Inject('S3_CLIENT')
    private readonly s3: S3Client,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.retry(() => this.ping(), 5, 400); // до 5 спроб, бекоф 400ms

    const required = (process.env.MINIO_REQUIRED_BUCKETS ?? '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    for (const b of required) {
      await this.ensureBucket(b);
    }

    this.ready = true;
    this.logger.log('MinIO OK: endpoint доступний, бакети готові');
  }

  async waitUntilReady(): Promise<void> {
    if (this.ready) return;
  }

  private async ping(): Promise<void> {
    const ac = new AbortController();
    const to = setTimeout(() => ac.abort(), 3000);
    try {
      await this.s3.send(new ListBucketsCommand({}), {
        abortSignal: ac.signal,
      });
    } finally {
      clearTimeout(to);
    }
  }

  async ensureBucket(bucket: string): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (e: any) {
      this.logger.log(`Bucket "${bucket}" не знайдено. Створюю...`);
      await this.s3.send(
        new CreateBucketCommand({
          Bucket: bucket,
        }),
      );
      this.logger.log(`Bucket "${bucket}" створено`);
    }
  }

  private async retry<T>(fn: () => Promise<T>, attempts = 3, baseMs = 250): Promise<T> {
    let last: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (e) {
        last = e;
        const delay = baseMs * 2 ** i;
        this.logger.warn(`MinIO check failed (try ${i + 1}/${attempts}): ${String(e)}. Retry in ${delay}ms…`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw last;
  }

  async saveImage(
    bucket: string,
    input: SaveImageInput,
  ): Promise<{ bucket: string; key: string; contentType: AllowedImageMime }> {
    // await this.ensureBucket(bucket); // ПОТІМ!!!!!!!!!

    const { contentType, extension } = this.validateImageType(input.mimeType, input.originalName, input.forceExt);

    const key = this.buildObjectKey(input.prefix, `${uuidv4()}.${extension}`);

    const uploader = new Upload({
      client: this.s3,
      params: {
        Bucket: bucket,
        Key: key,
        Body: input.buffer,
        ContentType: contentType,
        Metadata: input.metadata,
      },
      // queueSize / partSize можна тюнити під великі файли
    });

    await uploader.done();
    return { bucket, key, contentType };
  }

  async getImageUrl(bucket: string, key: string, expiresInSec = 300): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(this.s3, cmd, { expiresIn: expiresInSec });
  }

  async deleteImage(bucket: string, key: string): Promise<void> {
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  private buildObjectKey(prefix: string | undefined, filename: string): string {
    if (!prefix) return filename;
    const clean = prefix.endsWith('/') ? prefix : `${prefix}/`;
    return `${clean}${filename}`;
  }

  private validateImageType(
    mimeType?: string,
    originalName?: string,
    forceExt?: 'png' | 'jpg' | 'jpeg' | 'svg',
  ): {
    contentType: AllowedImageMime;
    extension: 'png' | 'jpg' | 'jpeg' | 'svg';
  } {
    if (forceExt) {
      const map: Record<string, AllowedImageMime> = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        svg: 'image/svg+xml',
      };
      return { contentType: map[forceExt], extension: forceExt };
    }

    const normalizedMime = mimeType?.toLowerCase();
    if (normalizedMime === 'image/png') return { contentType: 'image/png', extension: 'png' };
    if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg')
      return { contentType: 'image/jpeg', extension: 'jpg' };
    if (normalizedMime === 'image/svg+xml') return { contentType: 'image/svg+xml', extension: 'svg' };

    const ext = (originalName ?? '').split('.').pop()?.toLowerCase();
    if (ext === 'png') return { contentType: 'image/png', extension: 'png' };
    if (ext === 'jpg' || ext === 'jpeg') return { contentType: 'image/jpeg', extension: 'jpg' };
    if (ext === 'svg') return { contentType: 'image/svg+xml', extension: 'svg' };

    throw new BadRequestException('Підтримуються тільки PNG, JPEG або SVG');
  }
}
