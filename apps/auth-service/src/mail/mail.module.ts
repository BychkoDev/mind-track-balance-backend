import { Module } from '@nestjs/common';
import { join } from 'path';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.get<string>('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT') || 587,
          secure: config.get<string>('MAIL_SECURE') === 'true',
          auth: {
            user: config.get<string>('MAIL_USERNAME'),
            pass: config.get<string>('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"MindTrack Balance" <${config.get<string>('MAIL_FROM') || config.get<string>('MAIL_USERNAME')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        preview: false,
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
