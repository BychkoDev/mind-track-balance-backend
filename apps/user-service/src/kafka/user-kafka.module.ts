import * as fs from 'fs';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const KAFKA_SERVICE = 'USER_KAFKA_SERVICE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => {
          const caPath = configService.get<string>('KAFKA_SSL_CA_PATH');
          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'user-service',
                brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
                ...(caPath
                  ? {
                      ssl: {
                        ca: fs.readFileSync(caPath),
                      },
                    }
                  : {}),
                retry: {
                  initialRetryTime: 300,
                  retries: 8,
                },
              },
              // Явне налаштування групи для внутрішнього споживача
              // consumer: {
              //     groupId: 'auth-service-client-group',
              // },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class UserKafkaModule {}
