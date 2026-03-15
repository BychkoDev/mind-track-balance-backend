import { Body, Controller, FileTypeValidator, ParseFilePipe, Post, UploadedFile, UseGuards } from '@nestjs/common';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { ImageService } from './image.service';

/**
 * @author: Anatolii Bychko
 * Application Name: Mind Track Balance
 * Description: My Description
 * GitHub source code: https://github.com/BychkoDev/mind-track-balance-backend
 */

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
  ) {}

  // @Get(':storageId/image/:imageFileName')
  // async getImage(
  //   @Param('storageId') storageId: number,
  //   @Param('imageFileName') imageFileName: string,
  //   @Res({ passthrough: true }) res: Response,
  // ): Promise<StreamableFile> {
  //   const file = await this.fileStorageService.loadFileAsResource(imageFileName, storageId);

  //   const contentType = 'image/jpeg';
  //   res.set({
  //     'Content-Type': contentType,
  //     'Content-Disposition': `inline; filename="${audioFileName}"`,
  //   });

  //   return new StreamableFile(file);
  // }

  // @Post(':storageId/file-save')
  // @Roles('ROLE_SYSTEM')
  // @UseInterceptors(FileInterceptor('file'))
  // async saveFile(
  //   @Param('storageId') storageId: number,
  //   @UploadedFile() file: Express.Multer.File,
  //   @Body('firstName') firstName: string,
  // ) {
  //   if (!this.validateImageFile(file)) {
  //     throw new BadRequestException('File content type is not supported or NULL!');
  //   }
  //   return this.fileStorageService.saveFileInYourDirectory(file, storageId, firstName);
  // }

  // @Delete(':storageId/:imageFileName')
  // @Roles('ROLE_SYSTEM')
  // async deleteFile(@Param('storageId') storageId: number, @Param('imageFileName') imageFileName: string) {
  //   return this.fileStorageService.deleteFileFromStorage(imageFileName, storageId);
  // }

  // @Get(':storageId/avatar/:imageFileName')
  // async getUserAvatar(
  //   @Param('storageId') storageId: number,
  //   @Param('imageFileName') imageFileName: string,
  //   @Res({ passthrough: true }) res: Response,
  // ): Promise<StreamableFile> {
  //   const file = await this.fileStorageService.loadFileAsResource(imageFileName, storageId);
  //   res.set({ 'Content-Type': 'image/png' });
  //   return new StreamableFile(file);
  // }

  // private validateImageFile(file: Express.Multer.File): boolean {
  //   if (!file || !file.mimetype) return false;
  //   const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  //   return allowedTypes.includes(file.mimetype.toLowerCase());
  // }
}
