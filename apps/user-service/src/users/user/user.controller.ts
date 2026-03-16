import { Controller, Get, Patch, Req, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role } from '@app/common/enums/role.enum';
import { Roles } from '@app/common/decorators/roles.decorator';
import { EventPattern, Payload } from '@nestjs/microservices';

import { UserCreatedEvent } from './events/user-create.event';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@Controller('/api/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('me')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getProfile(@Req() req: { user: { sub: string } }) {
    const userUuid = req.user.sub;
    const profile = await this.userService.getProfile(userUuid);
    return profile || { message: 'Profile not found' };
  }

  @Patch('settings')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateSettings(@Req() req: { user: { sub: string } }, @Body() updateSettingsDto: UpdateSettingsDto) {
    const userUuid = req.user.sub;
    return await this.userService.updateSettings(userUuid, updateSettingsDto);
  }

  @Patch('profile')
  @Roles(Role.User, Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateProfile(@Req() req: { user: { sub: string } }, @Body() updateProfileDto: UpdateProfileDto) {
    const userUuid = req.user.sub;
    return await this.userService.updateProfile(userUuid, updateProfileDto);
  }

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: UserCreatedEvent) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!! ------ Received a new user_created event:', data);

    console.log(`Creating profile for user ${data.email} (${data.uuid})`);

    await this.userService.handleUserCreated(data);
  }
}
