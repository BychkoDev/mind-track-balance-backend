import { Injectable } from '@nestjs/common';
import { MindTrackPrismaService } from '@app/prisma-mind-track';

@Injectable()
export class WeeklyReportRepository {
  constructor(private readonly prisma: MindTrackPrismaService) {}

  async createReport(data: {
    userUuid: string;
    weekStartDate: Date;
    weekEndDate: Date;
    summaryText: string;
    totalEntries: number;
    averageMood: number | null;
    topTopics: string[];
  }) {
    // Assuming MindTrackWeeklyReport exists in the updated Prisma Schema
    return await (this.prisma as any).mindTrackWeeklyReport.create({
      data,
    });
  }

  async findReports(userUuid: string) {
    return await (this.prisma as any).mindTrackWeeklyReport.findMany({
      where: { userUuid },
      orderBy: { createdAt: 'desc' },
    });
  }
}
