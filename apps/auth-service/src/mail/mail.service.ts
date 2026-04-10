import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EventPattern, Payload } from '@nestjs/microservices';
import { SendUserEmailEvent } from './events/send-user-email.event';
import { SendWeeklyReportEvent } from './events/send-weekly-report.event';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async onModuleInit() {
    this.logger.log('Перевірка з\'єднання з SMTP сервером...');
    try {
      // Access the underlying nodemailer transporter
      const transporter = (this.mailerService as any).transporter;
      if (transporter && typeof transporter.verify === 'function') {
        const success = await transporter.verify();
        if (success) {
          this.logger.log('✅ З\'єднання з SMTP сервером (поштою) успішно встановлено!');
        }
      } else {
        this.logger.warn('⚠️ Транспортер SMTP не знайдено, перевірка неможлива.');
      }
    } catch (error: any) {
      this.logger.error(
        '❌ ПОМИЛКА підключення до SMTP сервера! Пошта не буде відправлятися. Перевір MAIL_HOST, MAIL_USERNAME та MAIL_PASSWORD.',
        error.message || String(error),
      );
    }
  }

  @EventPattern('send_welcome_mail')
  async sendWelcomeEmail(@Payload() event: SendUserEmailEvent) {
    this.logger.log(`Sending welcome email to ${event.to}`);
    try {
      await this.mailerService.sendMail({
        to: event.to,
        subject: 'Вітаємо у MindTrack Balance!',
        template: 'welcome',
        context: {
          name: event.name,
        },
      });
      this.logger.log(`✅ Welcome email successfully sent to ${event.to}`);
    } catch (e: any) {
      this.logger.error(`❌ Failed to send welcome email to ${event.to}: ${e.message}`);
    }
  }

  @EventPattern('send_activation_mail')
  async sendActivationEmail(@Payload() event: SendUserEmailEvent) {
    this.logger.log(`Sending activation email to ${event.to}`);
    try {
      await this.mailerService.sendMail({
        to: event.to,
        subject: 'Активація облікового запису MindTrack Balance',
        template: 'activation',
        context: {
          name: event.name,
          code: event.uuid,
        },
      });
      this.logger.log(`✅ Activation email successfully sent to ${event.to}`);
    } catch (e: any) {
      this.logger.error(`❌ Failed to send activation email to ${event.to}: ${e.message}`);
    }
  }

  async sendRawHtml(to: string, subject: string, html: string) {
    await this.mailerService.sendMail({
      to,
      subject,
      html,
    });
  }

  @EventPattern('send_weekly_report')
  async sendWeeklyReportEmail(@Payload() event: SendWeeklyReportEvent) {
    this.logger.log(`Sending weekly report email to ${event.to}`);
    try {
      const pdfBuffer = Buffer.from(event.pdfAttachment, 'base64');
      
      await this.mailerService.sendMail({
        to: event.to,
        subject: event.subject || 'Ваш тижневий звіт MindTrack Balance',
        template: 'weekly-report',
        context: {
          name: event.name,
          summaryText: event.summaryText,
        },
        attachments: [
          {
            filename: `mindtrack_report_${event.weekStart.split('T')[0]}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      });
      this.logger.log(`✅ Weekly report successfully sent to ${event.to}`);
    } catch (e: any) {
      this.logger.error(`❌ Failed to send weekly report to ${event.to}: ${e.message}`);
    }
  }
}
