import { WeeklyReportRepository } from './weekly-report.repository';
import { MindTrackRepository } from '../mind-track/mind-track.repository';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '@app/common';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class WeeklyReportService {
  private readonly logger = new Logger(WeeklyReportService.name);

  constructor(
    private readonly repository: WeeklyReportRepository,
    private readonly mindTrackRepository: MindTrackRepository,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    @Inject('AUTH_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async getReports(userUuid: string) {
    return await this.repository.findReports(userUuid);
  }

  async generateWeeklyReportForUser(userUuid: string, startDate: Date, endDate: Date) {
    this.logger.log(`Generating weekly report for user ${userUuid}`);

    // Fetch entries within the date range
    const entries = await this.mindTrackRepository.findEntries(userUuid);
    const weeklyEntries = entries.filter(
      (entry) => entry.createdAt >= startDate && entry.createdAt <= endDate,
    );

    if (weeklyEntries.length === 0) {
      this.logger.warn(`No entries found for user ${userUuid} in the given week. Skipping report.`);
      return null;
    }

    // Calculate basic stats
    const totalEntries = weeklyEntries.length;
    const moodSum = weeklyEntries.reduce((acc, entry) => acc + entry.moodScore, 0);
    const averageMood = totalEntries > 0 ? moodSum / totalEntries : null;

    // Collect all topics
    const allTopics = weeklyEntries.flatMap(e => e.aiTopics || []);
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Sort topics by frequency, take top 5
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);

    // Prepare context for Gemini
    const entriesContext = weeklyEntries
      .map((e) => `[${e.createdAt.toISOString()}] Mood: ${e.moodScore}/10 | Sentiment: ${e.aiSentiment} | Text: ${e.text || 'N/A'}`)
      .join('\n');

    // Fetch Template
    const templateRecord = await (this.prisma as any).promptTemplate.findUnique({
      where: { code: 'GENERATE_WEEKLY_REPORT' },
    });

    const systemInstruction =
      templateRecord?.isActive && templateRecord.systemPrompt
        ? templateRecord.systemPrompt
        : `You are an expert psychotherapist assistant. Summarize the user's weekly journal entries. 
Provide a supportive, insightful summary (1-2 paragraphs) identifying emotional trends, triggers, and progress. 
Return ONLY a raw JSON object string: 
{ "summaryText": "Your summary here" }`;

    const userTemplate =
      templateRecord?.isActive && templateRecord.userPrompt
        ? templateRecord.userPrompt
        : `Entries for the week:\n{{entries}}`;

    const prompt = userTemplate.replace('{{entries}}', entriesContext);

    try {
      const result = await this.aiService.generateCustomJson(prompt, systemInstruction);

      if (!result || !result.summaryText) {
         this.logger.error('Gemini returned an invalid format for Weekly Report');
         return null;
      }

      // Save the report in the database
      const report = await this.repository.createReport({
        userUuid,
        weekStartDate: startDate,
        weekEndDate: endDate,
        summaryText: result.summaryText,
        totalEntries,
        averageMood,
        topTopics,
      });

      // Generate PDF
      const pdfBuffer = await this.generatePdf(report, weeklyEntries);

      // Fetch user profile to get email and name
      const userProfile = await (this.prisma as any).user.findUnique({
        where: { uuid: userUuid },
        select: { email: true, firstname: true, role: true },
      });

      if (userProfile && userProfile.email) {
        // Send email via Kafka
        this.kafkaClient.emit('send_weekly_report', {
          to: userProfile.email,
          name: userProfile.firstname || 'Користувач',
          subject: 'Ваш тижневий звіт MindTrack Balance',
          pdfAttachment: pdfBuffer.toString('base64'),
          summaryText: result.summaryText,
          weekStart: startDate.toISOString(),
          weekEnd: endDate.toISOString(),
        });
        this.logger.log(`Weekly report email queued for ${userProfile.email}`);
      }

      return report;
    } catch (error) {
      this.logger.error('Failed to generate weekly report with Gemini', error);
      return null;
    }
  }

  private async generatePdf(report: any, entries: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Add Header
        doc.fontSize(20).text('MindTrack Balance - Тижневий Звіт', { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(12).text(`Період: ${report.weekStartDate.toLocaleDateString()} - ${report.weekEndDate.toLocaleDateString()}`);
        doc.text(`Всього записів: ${report.totalEntries}`);
        doc.text(`Середній настрій: ${report.averageMood ? report.averageMood.toFixed(1) : 'N/A'}/10`);
        doc.moveDown();

        // Top Topics
        if (report.topTopics && report.topTopics.length > 0) {
          doc.fontSize(14).text('Основні теми тижня:', { underline: true });
          report.topTopics.forEach((topic: string) => {
            doc.fontSize(12).text(`• ${topic}`);
          });
          doc.moveDown();
        }

        // AI Summary
        doc.fontSize(14).text('Резюме від ШІ:', { underline: true });
        doc.fontSize(12).text(report.summaryText, { align: 'justify' });
        doc.moveDown(2);

        // Entries List
        doc.fontSize(14).text('Ваші записи:', { underline: true });
        doc.moveDown();
        entries.forEach((e) => {
          doc.fontSize(10).text(`[${e.createdAt.toLocaleString()}] Настрій: ${e.moodScore}/10`);
          if (e.text) {
            doc.fontSize(10).text(`Текст: ${e.text}`);
          }
          if (e.aiTopics && e.aiTopics.length > 0) {
            doc.fontSize(9).fillColor('gray').text(`Теги: ${e.aiTopics.join(', ')}`);
          }
          doc.fillColor('black').moveDown(0.5);
        });

        doc.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}
