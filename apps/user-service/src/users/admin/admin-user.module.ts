import { Module } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { AdminUserRepository } from './admin-user.repository';
import { AdminUserController } from './admin-user.controller';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule],
  providers: [AdminUserService, AdminUserRepository],
  controllers: [AdminUserController],
  exports: [AdminUserModule],
})
export class AdminUserModule {}
