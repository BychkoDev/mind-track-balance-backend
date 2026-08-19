import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

@Injectable()
export class AttentionPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const dbUser = configService.get<string>('DB_USERNAME_ATTENTION');
    const dbPassword = configService.get<string>('DB_PASSWORD_ATTENTION');
    const dbHost = configService.get<string>('DB_HOST');
    const dbPort = configService.get<string>('DB_PORT');
    const dbName = configService.get<string>('DB_NAME_ATTENTION');

    if (!dbUser) throw new Error('DB_USERNAME_ATTENTION is missing');
    if (!dbPassword) throw new Error('DB_PASSWORD_ATTENTION is missing');
    if (!dbHost) throw new Error('DB_HOST is missing');
    if (!dbPort) throw new Error('DB_PORT is missing');
    if (!dbName) throw new Error('DB_NAME_ATTENTION is missing');

    const connectionString =
      `postgresql://${dbUser}:` + `${dbPassword}@` + `${dbHost}:${dbPort}/` + `${dbName}?schema=public`;

    super({
      adapter: new PrismaPg({
        connectionString,
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
