import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '@app/common/decorators/roles.decorator';
import { Role } from '@app/common/enums/role.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { AuthUserService } from './auth-user.service';

@Controller('/api/v1/auth-user')
export class AuthUserController {
  constructor(private readonly authUserService: AuthUserService) {}

  @Get()
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getHello() {
    return { message: '✅ Все працює!' };
  }
}
