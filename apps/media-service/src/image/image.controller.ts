import {
  Body,
  Controller,
  FileTypeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport';
import { ImageService } from './image.service';

/**
 * @author: Anatolii Bychko
 * Application Name: Learn English
 * Description: My Description
 * GitHub source code: https://github.com/bychko4891/learnenglish
 */

class UploadImageDto {
  bucket!: string; // у який бакет класти
  prefix?: string; // напр. 'orig/' (за замовчуванням нижче)
  previewWidth?: number; // напр. 640 для прев’ю (необов’язково)
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

  // @GetMapping("/{storageId}/audio/{audioFileName:.+}")
  // public ResponseEntity<Resource> getAudioFileFromStorage(@PathVariable Long storageId, @PathVariable String audioFileName) {
  //     Resource resource = fileStorageService.loadFileAsResource(audioFileName, storageId);
  //     return ResponseEntity.ok(resource);
  // }
  //
  // @GetMapping("/{storageId}/image/{imageFileName:.+}")
  // public ResponseEntity<byte[]> getImage(@PathVariable Long storageId, @PathVariable String imageFileName) throws IOException {
  //     var resource = fileStorageService.loadFileAsResource(imageFileName, storageId);
  //     InputStream in = resource.getInputStream();
  //     String contentType = URLConnection.guessContentTypeFromStream(in);
  //     byte[] imageBytes = IOUtils.toByteArray(in);
  //     HttpHeaders headers = new HttpHeaders();
  //     headers.setContentType(contentType != null && !contentType.equals("application/xml") ? MediaType.parseMediaType(contentType) : PlusMediaType.IMAGE_SVG);
  //     headers.setContentLength(imageBytes.length);
  //     headers.setContentDisposition(ContentDisposition.builder("inline").filename(resource.getFilename()).build());
  //     return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
  // }
  //
  // @PostMapping(path = "/{storageId}/file-save", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE})
  // @PreAuthorize("hasAuthority('ROLE_SYSTEM')")
  // public String saveFile(@PathVariable Long storageId, @RequestPart MultipartFile file, @RequestPart String firstName) {
  //     return fileStorageService.saveFileInYourDirectory(file, storageId, firstName);
  // }
  //
  // @DeleteMapping(path = "/{storageId}/{imageFileName:.+}")
  // @PreAuthorize("hasAuthority('ROLE_SYSTEM')")
  // async deleteFile(@PathVariable Long storageId, @PathVariable String imageFileName) {
  //     fileStorageService.deleteFileFromStorage(imageFileName, storageId);
  // }

  //    @GetMapping("/{storageId}/image/{imageFileName:.+}")
  //    public ResponseEntity<byte[]> getUserAvatar(@PathVariable Long storageId, @PathVariable String imageFileName) throws IOException {
  //        Resource resource = fileStorageService.loadFileAsResource(imageFileName, storageId);
  //        InputStream in = resource.getInputStream();
  //        byte[] imageBytes = IOUtils.toByteArray(in);
  //        HttpHeaders headers = new HttpHeaders();
  //        headers.setContentType(MediaType.IMAGE_PNG);
  //        headers.setContentLength(imageBytes.length);
  //        headers.setContentDisposition(ContentDisposition.builder("inline").filename(resource.getFilename()).build());
  //
  //        return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
  //    }

  //
  //    @GetMapping("/word-img/{imageFileName:.+}")
  //    public ResponseEntity<byte[]> dictionaryPageImage(@PathVariable String imageFileName) throws IOException {
  //        Resource resource = fileStorageService.loadFileAsResource(imageFileName,vocabularyPageStorePath);
  //        InputStream in = resource.getInputStream();
  //        byte[] imageBytes = IOUtils.toByteArray(in);
  //        HttpHeaders headers = new HttpHeaders();
  //        headers.setContentLength(imageBytes.length);
  //        headers.setContentDisposition(ContentDisposition.builder("inline").filename(resource.getFilename()).build());
  //        return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
  //    }
  //
  //
  //    @GetMapping("/webimg/{imageFileName:.+}")
  //    public ResponseEntity<byte[]> webImage(@PathVariable String imageFileName) throws IOException {
  //        Resource resource = fileStorageService.loadFileAsResource(imageFileName, webImageStorePath);
  //        InputStream in = resource.getInputStream();
  //        byte[] imageBytes = IOUtils.toByteArray(in);
  //        HttpHeaders headers = new HttpHeaders();
  //        headers.setContentLength(imageBytes.length);
  //        headers.setContentDisposition(ContentDisposition.builder("inline").filename(resource.getFilename()).build());
  //        return new ResponseEntity<>(imageBytes, headers, HttpStatus.OK);
  //    }

  // private boolean validateImageFile(MultipartFile file) {
  //     if(file.getContentType() == null) throw new BadRequestException(new CustomFieldError("error" , "File content file is NULL!"));
  //     String contentType = file.getContentType();
  //     return contentType.equalsIgnoreCase("image/jpeg") || contentType.equalsIgnoreCase("image/png")
  //             || contentType.equalsIgnoreCase("image/webp") || contentType.equalsIgnoreCase("image/jpg");
  // }
}
