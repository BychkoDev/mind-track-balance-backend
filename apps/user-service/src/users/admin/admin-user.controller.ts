import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { Role } from '@app/common/enums/role.enum';
import { Roles } from '@app/common/decorators/roles.decorator';
// import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('/api/v1/admin')
export class AdminUserController {
  @Get('me')
  @Roles(Role.Admin)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  getProfile() {
    return { message: 'This is your profile data from User Service!' };
  }

  // @EventPattern('user_created')
  // handleUserCreated(@Payload() data: UserCreatedEvent) {
  //     console.log('!!!!!!!!!!!!!!!!!!!!!!!!! ------ Received a new user_created event:', data);
  //

  // }
}
