import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@app/common';
import { WeeklyReportService } from './weekly-report.service';

@Injectable()
export class WeeklyReportCronService {
  private readonly logger = new Logger(WeeklyReportCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly reportService: WeeklyReportService,
  ) {}

  // Run every Sunday at 20:00 (8:00 PM)
  // Or for testing, use CronExpression.EVERY_MINUTE
  @Cron('0 20 * * 0') 
  async handleWeeklyReportGeneration() {
    this.logger.log('Starting weekly report generation cron job...');

    // 1. Calculate the previous week's boundaries
    const endDate = new Date(); // right now
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 7); // 7 days ago

    // 2. Fetch all active users who have entries in the past 7 days.
    // Ideally, we'd only generate reports for active users or users with recent activity.
    try {
      // Find distinct user IDs who have logged at least one entry this week
      const activeUserUuidsResult = await (this.prisma as any).mindTrackEntry.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: { userUuid: true },
        distinct: ['userUuid'],
      });

      const userUuids = activeUserUuidsResult.map((r: any) => r.userUuid);
      this.logger.log(`Found ${userUuids.length} active users for this week.`);

      // 3. Process each user sequentially to respect API rate limits (or use Promise.all chunks)
      for (const uuid of userUuids) {
        await this.reportService.generateWeeklyReportForUser(uuid, startDate, endDate);
        // Small delay between requests to avoid hitting Gemini rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      this.logger.log('Weekly report generation job completed successfully.');
    } catch (error) {
      this.logger.error('Error executing weekly report generation job', error);
    }
  }
}
