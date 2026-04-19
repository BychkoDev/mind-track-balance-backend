import * as fs from 'fs';
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

export const KAFKA_SERVICE = 'AUTH_KAFKA_SERVICE';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        useFactory: (configService: ConfigService) => {
          const caPath = configService.get<string>('KAFKA_SSL_CA_PATH');

          return {
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: 'auth-service',
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
              consumer: {
                groupId: 'auth-service-client-group',
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class AuthKafkaModule {}
