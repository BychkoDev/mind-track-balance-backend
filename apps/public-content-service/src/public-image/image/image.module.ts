import { Module } from '@nestjs/common';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  // providers: [PublicImageService, PublicImageRepository],
  // controllers: [CategoryController],
  exports: [ImageModule],
})
export class ImageModule {}
