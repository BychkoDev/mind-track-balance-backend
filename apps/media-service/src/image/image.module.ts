import { Module } from '@nestjs/common';
import { ImageRepository } from './image.repository';
import { ImageService } from './image.service';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  providers: [ImageService, ImageRepository],
  // controllers: [PageController],
  exports: [ImageModule],
})
export class ImageModule {}
