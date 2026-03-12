import { Module } from '@nestjs/common';
import { CommonModule } from '@app/common';
import { AuthUserService } from './auth-user.service';
import { AuthUserRepository } from './auth-user.repository';
import { AuthKafkaModule } from '../kafka/auth-kafka.module';

@Module({
  imports: [AuthKafkaModule, CommonModule],
  controllers: [],
  providers: [AuthUserService, AuthUserRepository],
  exports: [AuthUserService],
})
export class AuthUserModule {}
