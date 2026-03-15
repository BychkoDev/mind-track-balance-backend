import { Controller, Get } from '@nestjs/common';
import { PageService } from './page.service';

@Controller('/api/v1/page')
export class PageController {
  constructor(private readonly service: PageService) {}

  @Get('/url')
  async getHello() {
    return { message: ' Все працює!' };
  }

  // @Post('/create')
  // @Roles(Role.Admin)
  // @UseGuards(AuthGuard('jwt'), RolesGuard)
  // @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  // async create(@Body() loginDto: LoginDto) {
  //   return await this.authService.login(loginDto);
  // }
}
