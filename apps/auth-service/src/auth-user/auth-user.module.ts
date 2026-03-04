import { Module } from '@nestjs/common';
import { CommonModule } from '@app/common';
import { AuthUserController } from './auth-user.controller';
import { AuthUserService } from './auth-user.service';
import { AuthUserRepository } from './auth-user.repository';
import { AuthKafkaModule } from '../kafka/auth-kafka.module';

@Module({
  imports: [
    AuthKafkaModule,
    CommonModule,
  ],
  controllers: [AuthUserController],
  providers: [AuthUserService, AuthUserRepository],
  exports: [AuthUserService],
})
export class AuthUserModule {}
