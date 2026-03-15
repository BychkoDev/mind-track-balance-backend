import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { AuthUserModule } from '../auth-user/auth-user.module';
import { RsaKeyModule } from '../rsa-key/rsa-key.module';
import { MailModule } from '../mail/mail.module';
import { PrismaModule } from '@app/prisma-auth';
import { join } from 'path';

const envFilePath =
  process.env.NODE_ENV === 'production'
    ? join(process.cwd(), '.env.prod')
    : join(process.cwd(), '.env.dev');

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RsaKeyModule,
    AuthUserModule,
    PassportModule,
    MailModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath
    }),
  ],
})
export class AppModule {}