import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { UserController } from './user.controller';
import { UserKafkaModule } from '../../kafka/user-kafka.module';
import { CommonModule } from '@app/common';

@Module({
  imports: [CommonModule, UserKafkaModule],
  providers: [UserService, UserRepository],
  controllers: [UserController],
  exports: [UserModule],
})
export class UserModule {}
