import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role } from '../../../../../packages/auth-db/src/generated/prisma/enums';
import { Roles } from '@app/common/decorators/roles.decorator';
import { AdminUserService } from './admin-user.service';
// import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('/api/v1/admin')
export class AdminUserController {
  constructor(private readonly adminService: AdminUserService) {}

  @Get('me')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getProfile() {
    return { message: 'This is your profile data from User Service!' };
  }

  @Get('users')
  @Roles(Role.ADMIN)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  async getAllUsers() {
    return await this.adminService.getAllUsers();
  }

  // @EventPattern('user_created')
  // handleUserCreated(@Payload() data: UserCreatedEvent) {
  //     console.log('!!!!!!!!!!!!!!!!!!!!!!!!! ------ Received a new user_created event:', data);
  //

  // }
}
