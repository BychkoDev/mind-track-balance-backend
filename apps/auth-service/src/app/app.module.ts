import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from '../auth/auth.module';
import { AuthUserModule } from '../auth-user/auth-user.module';
import { RsaKeyModule } from '../rsa-key/rsa-key.module';
import { MailModule } from '../mail/mail.module';

// const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
// console.log("dkflgkfd dflgk;fdgl fdg^ -->> " + envFile)
// console.log("dirname: --> " + __dirname)
// const envPath = resolve(__dirname, envFile); // зміни шлях під свою структуру
//
// if (!existsSync(envPath)) {
//     throw new Error(`❌ ENV файл ${envFile} не знайдено за шляхом: ${envPath}`);
// }

@Module({
  imports: [
    AuthModule,
    RsaKeyModule,
    AuthUserModule,
    PassportModule,
    MailModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'production'
          ? 'apps/auth-service/.env.prod'
          : 'apps/auth-service/.env.dev',
    }),
  ],
})
export class AppModule {}
