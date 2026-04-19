import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdviceService } from './advice.service';
import { MindTrackPrismaService } from '@app/prisma-mind-track';

@Injectable()
export class AdviceCronService {
  private readonly logger = new Logger(AdviceCronService.name);

  constructor(
    private readonly adviceService: AdviceService,
    private readonly prisma: MindTrackPrismaService,
  ) {}

  // Run every day at 8:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleDailyAdviceGeneration() {
    this.logger.log('Starting daily advice generation CRON job...');

    try {
      // Find all users who have had a mind track entry in the last 7 days
      // This is a naive approach, might need pagination for large user bases
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const activeUsers = await this.prisma.mindTrackEntry.findMany({
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        select: { userUuid: true },
        distinct: ['userUuid'],
      });

      this.logger.log(`Found ${activeUsers.length} active users for advice generation.`);

      for (const entry of activeUsers) {
        try {
          // Delay briefly to avoid hitting rate limits on Gemini
          await new Promise((resolve) => setTimeout(resolve, 2000));
          await this.adviceService.generateAdviceForUser(entry.userUuid);
        } catch (err) {
          this.logger.error(`Failed to generate advice for user ${entry.userUuid} during CRON`, err);
        }
      }

      this.logger.log('Daily advice generation CRON job completed successfully.');
    } catch (error) {
      this.logger.error('CRON job failed to generate daily advice', error);
    }
  }
}
