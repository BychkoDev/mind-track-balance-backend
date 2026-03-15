import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { ClientKafka } from '@nestjs/microservices';
import { UserCreatedEvent } from './events/user-create.event';
import { KAFKA_SERVICE } from '../../kafka/user-kafka.module';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class UserService {
  constructor(
    private readonly repository: UserRepository,
    @Inject(KAFKA_SERVICE) private readonly kafkaClient: ClientKafka,
  ) {}

  async handleUserCreated(data: UserCreatedEvent) {
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!! ------ Received a new user_created event:', data);

    try {
      await this.repository.createUserProfile({
        uuid: data.uuid,
        email: data.email,
        firstname: data.name,
      });
      console.log(`Profile created successfully for ${data.email}`);
    } catch (error) {
      console.error(`Failed to create profile for ${data.email}`, String(error));
    }

    this.kafkaClient.emit('send_welcome_mail', {
      to: data.email,
      email: data.email,
      serviceCodeUUID: data.serviceCodeUUID,
    });
  }

  async updateSettings(uuid: string, dto: UpdateSettingsDto) {
    return await this.repository.updateSettings(uuid, {
      timezone: dto.timezone,
      locale: dto.locale,
    });
  }
}
