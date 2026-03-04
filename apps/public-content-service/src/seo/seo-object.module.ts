import { Module } from '@nestjs/common';
import { SeoObjectService } from './seo-object.service';
import { SeoObjectRepository } from './seo-object.repository';
import { SeoObjectController } from './seo-object.controller';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  providers: [SeoObjectService, SeoObjectRepository],
  controllers: [SeoObjectController],
  exports: [SeoObjectModule],
})
export class SeoObjectModule {}
