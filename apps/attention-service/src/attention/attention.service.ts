import { Injectable, Logger } from '@nestjs/common';
import { AttentionPrismaService } from '@app/prisma-attention';
import { SyncAttentionBatchDto, UpsertAttentionRuleDto } from './dto/attention.dto';

@Injectable()
export class AttentionService {
  private readonly logger = new Logger(AttentionService.name);

  constructor(private readonly prisma: AttentionPrismaService) {}

  async getConfig(userUuid: string) {
    const rules = await this.prisma.attentionRule.findMany({
      where: { userUuid },
      select: {
        domain: true,
        isBlocked: true,
        isTracked: true,
        dailyLimitSec: true,
      },
    });

    const todayString = new Date().toISOString().split('T')[0];
    const today = new Date(todayString); // This creates exactly UTC midnight for the current local date

    const todayLogs = await this.prisma.attentionLog.findMany({
      where: {
        userUuid,
        date: today,
      },
      select: {
        domain: true,
        durationSec: true,
      },
    });

    const logsMap = new Map(todayLogs.map(l => [l.domain, l.durationSec]));

    return rules.map(rule => ({
      ...rule,
      todaySeconds: logsMap.get(rule.domain) || 0,
    }));
  }

  async upsertRule(userUuid: string, dto: UpsertAttentionRuleDto) {
    const updateData: any = {};
    if (dto.isBlocked !== undefined) updateData.isBlocked = dto.isBlocked;
    if (dto.isTracked !== undefined) updateData.isTracked = dto.isTracked;
    if (dto.dailyLimitSec !== undefined) updateData.dailyLimitSec = dto.dailyLimitSec;

    return await this.prisma.attentionRule.upsert({
      where: {
        userUuid_domain: {
          userUuid,
          domain: dto.domain,
        },
      },
      update: updateData,
      create: {
        userUuid,
        domain: dto.domain,
        isBlocked: dto.isBlocked,
        isTracked: dto.isTracked ?? true,
        dailyLimitSec: dto.dailyLimitSec,
      },
    });
  }

  async syncBatch(userUuid: string, dto: SyncAttentionBatchDto) {
    const results: any[] = [];

    // Process each record sequentially (or use transactions)
    for (const record of dto.records) {
      try {
        const recordDate = new Date(record.date);

        const created = await this.prisma.attentionLog.upsert({
          where: {
            userUuid_domain_date: {
              userUuid,
              domain: record.domain,
              date: recordDate,
            },
          },
          update: {
            durationSec: {
              increment: record.durationSec,
            },
          },
          create: {
            userUuid,
            domain: record.domain,
            durationSec: record.durationSec,
            date: recordDate,
          },
        });
        results.push(created);
      } catch (err) {
        this.logger.error(`Failed to sync attention log for domain ${record.domain}`, err);
      }
    }
    return { success: true, processed: results.length };
  }

  async getStats(userUuid: string, startDate?: string, endDate?: string) {
    const where: any = { userUuid };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const grouped = await this.prisma.attentionLog.groupBy({
      by: ['domain'],
      where,
      _sum: {
        durationSec: true,
      },
      orderBy: {
        _sum: {
          durationSec: 'desc',
        },
      },
    });

    return grouped.map(g => ({
      domain: g.domain,
      durationSec: g._sum.durationSec || 0,
    }));
  }

  async getTimeline(userUuid: string, days: number = 7) {
    const startDateString = new Date().toISOString().split('T')[0];
    const startDate = new Date(startDateString);
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.prisma.attentionLog.findMany({
      where: {
        userUuid,
        date: {
          gte: startDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return logs.map(log => ({
      date: log.date.toISOString().split('T')[0],
      domain: log.domain,
      durationSec: log.durationSec,
    }));
  }
}
