import {
  Body,
  Controller,
  FileTypeValidator,
  Get,
  Param,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { ImageService } from './image.service';

class UploadImageDto {
  bucket!: string;
  prefix?: string;
  previewWidth?: number;
}

@Controller('/api/v1/image-storage')
export class ImageController {
  constructor(private readonly service: ImageService) {}

  @Post('/upload/web-img')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadWebImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({
            fileType: /^image\/(png|jpe?g|svg\+xml|webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ) {
    return this.service.uploadWebImage(file, body.bucket, body.prefix);
  }

  @Get('/:uuid')
  async getImageUrl(@Param('uuid') uuid: string) {
    const url = await this.service.getImageUrl(uuid);
    return { url };
  }
}
