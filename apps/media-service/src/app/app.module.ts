import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3StorageModule } from '../s3-storage/s3-storage.module';
import { ImageModule } from '../image/image.module';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { CommonModule } from '@app/common';

@Module({
  imports: [
    S3StorageModule,
    ImageModule,
    PassportModule,
    CommonModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
    }),
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  ],
})
export class AppModule {}
