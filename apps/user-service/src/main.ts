import * as fs from 'fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';

process.env.TZ = process.env.TZ || 'Europe/Kiev';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT_USER') || 4091;
  const caPath = configService.get<string>('KAFKA_SSL_CA_PATH');

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: configService.getOrThrow<string>('KAFKA_BROKERS').split(','),
        ...(caPath ? { ssl: { ca: fs.readFileSync(caPath) } } : {}),
        retry: {
          initialRetryTime: 300,
          retries: 8,
        },
      },
      consumer: {
        groupId: 'user-service-consumer',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(port);
}
bootstrap();