import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({
  path: resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev'),
});

const connectionString =
  `postgresql://${process.env.DB_USERNAME_USER}:` +
  `${process.env.DB_PASSWORD_USER}@` +
  `${process.env.DB_HOST}:${process.env.DB_PORT}/` +
  `${process.env.DB_NAME_USER}?schema=public`;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

async function main() {
  await prisma.user.upsert({
    where: {
      email: 'jane@example.com',
    },
    update: {},
    create: {
      uuid: '84f12b14-08f5-4487-a69d-00f35cdd562c',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      role: 'USER',
      active: true,
      login: 'jane',
      about: 'Hello there',
      vip: false,
      vipExpirationDate: new Date(),
      gender: 'FEMALE',
      userIp: '127.0.0.1',
      lastVisit: new Date(),
      createdAt: new Date(),
    },
  });

  await prisma.adminUser.upsert({
    where: {
      email: 'admin@example.com',
    },
    update: {},
    create: {
      uuid: '09350120-de75-40a2-a865-10f88efc1d60',
      fullName: 'System Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      active: true,
      createdAt: new Date(),
    },
  });

  console.log('Users seed completed');
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
