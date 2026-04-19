import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({
  path: resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev'),
});

const connectionString =
  process.env.DATABASE_URL ||
  `postgresql://${process.env.DB_USERNAME_AUTH}:` +
    `${process.env.DB_PASSWORD_AUTH}@` +
    `${process.env.DB_HOST}:${process.env.DB_PORT}/` +
    `${process.env.DB_NAME_AUTH}?schema=public`;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});


async function main() {
  console.log('Starting seed...');
  await prisma.authUser.upsert({
    where: {
      email: 'jane@example.com',
    },
    update: {},
    create: {
      uuid: '84f12b14-08f5-4487-a69d-00f35cdd562c',
      email: 'jane@example.com',
      password: '$2a$12$pqZX2JYYK0WAafNqWwx2euj9KlToouWj6OyuJpC4ZgB4aIg6EW2SK',
      active: true,
      role: 'USER',
    },
  });

  await prisma.authUser.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {},
    create: {
      uuid: '09350120-de75-40a2-a865-10f88efc1d60',
      email: 'admin@example.com',
      password: '$2a$12$7gKJT39yz7dnN0n6esIFBeTaWjRynbWudzyDqI7NNs6qiIDiIUVH.',
      active: true,
      role: 'ADMIN',
    },
  });

  console.log('Seed completed');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
