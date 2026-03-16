import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '..', '..', process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev');

dotenv.config({ path: envPath });

const DATABASE_URL_MEDIA =
  `postgresql://${process.env.DB_USERNAME_MEDIA}:` +
  `${process.env.DB_PASSWORD_MEDIA}@` +
  `${process.env.DB_HOST}:${process.env.DB_PORT}/` +
  `${process.env.DB_NAME_MEDIA}?schema=public`;

console.log('prisma.config.ts DATABASE_URL_MEDIA =', DATABASE_URL_MEDIA);

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: DATABASE_URL_MEDIA,
  },
});
