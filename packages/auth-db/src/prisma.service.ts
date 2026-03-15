import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

@Injectable()
export class AuthPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const dbUser = configService.get<string>('DB_USERNAME_AUTH');
    const dbPassword = configService.get<string>('DB_PASSWORD_AUTH');
    const dbHost = configService.get<string>('DB_HOST');
    const dbPort = configService.get<string>('DB_PORT');
    const dbName = configService.get<string>('DB_NAME_AUTH');

    if (!dbUser) throw new Error('DB_USERNAME_AUTH is missing');
    if (!dbPassword) throw new Error('DB_PASSWORD_AUTH is missing');
    if (!dbHost) throw new Error('DB_HOST is missing');
    if (!dbPort) throw new Error('DB_PORT is missing');
    if (!dbName) throw new Error('DB_NAME_AUTH is missing');

    const connectionString =
      `postgresql://${dbUser}:` +
      `${dbPassword}@` +
      `${dbHost}:${dbPort}/` +
      `${dbName}?schema=public`;

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












// import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from './generated/prisma/client';

// @Injectable()
// export class AuthPrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   constructor() {
//     const adapter = new PrismaPg({
//       connectionString: process.env.AUTH_DATABASE_URL!,
//     });

//     super({ adapter });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }



// import dotenv from 'dotenv';
// import { defineConfig } from 'prisma/config';
// import { dirname, resolve } from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const envPath = resolve(
//   __dirname,
//   '..',
//   '..',
//   process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev',
// );

// dotenv.config({ path: envPath });

// const DATABASE_URL_AUTH =
//   `postgresql://${process.env.DB_USERNAME_AUTH}:` +
//   `${process.env.DB_PASSWORD_AUTH}@` +
//   `${process.env.DB_HOST}:${process.env.DB_PORT}/` +
//   `${process.env.DB_NAME_AUTH}?schema=public`;

// export default defineConfig({
//   schema: 'prisma/schema.prisma',
//   migrations: {
//     path: 'prisma/migrations',
//   },
//   datasource: {
//     url: DATABASE_URL_AUTH,
//   },
// });