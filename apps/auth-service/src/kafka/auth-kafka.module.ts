import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const KAFKA_SERVICE = 'AUTH_KAFKA_SERVICE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        // imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: 'auth-service',
              brokers: configService
                .getOrThrow<string>('KAFKA_BROKERS')
                .split(','),
              retry: {
                initialRetryTime: 300,
                retries: 8,
              },
            },
            consumer: {
              groupId: 'auth-service-client-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class AuthKafkaModule {}
