import {
  Controller,
  Get,
  Patch,
  Req,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role } from '@app/common/enums/role.enum';
import { Roles } from '@app/common/decorators/roles.decorator';
import { EventPattern, Payload } from '@nestjs/microservices';

import { UserCreatedEvent } from './events/user-create.event';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UserService } from './user.service';

@Controller('/api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('me')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getProfile() {
    return { message: 'This is your profile data from User Service!' };
  }

  @Patch('settings')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateSettings(
    @Req() req: { user: { sub: string } },
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    const userUuid = req.user.sub;
    return await this.userService.updateSettings(userUuid, updateSettingsDto);
  }

  @EventPattern('user_created')
  handleUserCreated(@Payload() data: UserCreatedEvent) {
    console.log(
      '!!!!!!!!!!!!!!!!!!!!!!!!! ------ Received a new user_created event:',
      data,
    );

    // Тут ваша логіка:
    // - Створити профіль для нового користувача
    // - Записати дані в свою базу
    console.log(`➡️ Creating profile for user ${data.email} (${data.uuid})`);
    
    // TODO: Calls a user creation method in UserService
  }
}
