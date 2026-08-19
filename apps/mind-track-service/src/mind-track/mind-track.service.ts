import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { MindTrackRepository } from './mind-track.repository';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { AiService } from '../ai/ai.service';
import { MindTrackAdviceRepository } from './mind-track-advice.repository';

@Injectable()
export class MindTrackService {
  private readonly logger = new Logger(MindTrackService.name);

  constructor(
    private readonly repository: MindTrackRepository,
    private readonly adviceRepository: MindTrackAdviceRepository,
    private readonly aiService: AiService,
  ) {}

  async createEntry(userUuid: string, dto: CreateEmotionLogDto, userRole?: string) {
    // Check Rate Limiting
    const latestEntries = await this.repository.findEntries(userUuid, { limit: 1 });
    if (latestEntries && latestEntries.length > 0) {
      const lastEntry = latestEntries[0];
      const timeSinceLastMs = Date.now() - new Date(lastEntry.createdAt).getTime();
      const hoursSinceLast = timeSinceLastMs / (1000 * 60 * 60);

      // Assume PRO role or vip flag. If userRole is 'PRO' or similar, limit is 1h, otherwise 4h.
      const isPro = userRole === 'PRO' || userRole === 'VIP';
      const cooldownHours = isPro ? 1 : 4;

      if (hoursSinceLast < cooldownHours) {
        throw new HttpException(
          `Rate limit exceeded. You can log emotions once every ${cooldownHours} hours.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const entry = await this.repository.createEntry(userUuid, dto);

    // Let the AI analyze the full entry context (metrics + optional text)
    this.analyzeAndSave(entry, userUuid).catch((err) =>
      this.logger.error('Background AI analysis failed', err),
    );

    return entry;
  }

  private async analyzeAndSave(entry: any, userUuid: string) {
    this.logger.log(`Starting AI analysis for entry ${entry.uuid}`);
    const result = await this.aiService.analyzeEntry(entry);

    if (result) {
      this.logger.log(`AI Analysis complete for ${entry.uuid}. Sentiment: ${result.sentiment}`);

      await this.repository.updateEntry(entry.uuid, userUuid, {
        aiSentiment: result.sentiment,
        aiTopics: result.topics,
      } as any);
    }
  }

  async getEntries(userUuid: string, filters?: { limit?: number; skip?: number; startDate?: Date }) {
    return await this.repository.findEntries(userUuid, filters);
  }

  async getEntryById(uuid: string, userUuid: string) {
    const entry = await this.repository.findEntryById(uuid, userUuid);
    if (!entry) {
      throw new NotFoundException('Запис не знайдено');
    }
    return entry;
  }

  async updateEntry(uuid: string, userUuid: string, dto: UpdateEntryDto) {
    await this.getEntryById(uuid, userUuid);
    return await this.repository.updateEntry(uuid, userUuid, dto);
  }

  async deleteEntry(uuid: string, userUuid: string) {
    await this.getEntryById(uuid, userUuid);
    return await this.repository.deleteEntry(uuid, userUuid);
  }

  async getLatestAdvice(userUuid: string) {
    return await this.adviceRepository.getLatestAdvice(userUuid);
  }

  async generateAdvice(userUuid: string) {
    // 0. Check if advice was generated recently (7 days timer)
    const latestAdvice = await this.getLatestAdvice(userUuid);
    if (latestAdvice) {
      const now = new Date();
      const generatedAt = new Date(latestAdvice.createdAt);
      const daysSince = Math.floor((now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince < 7) {
        throw new Error(`You can generate a new advice in ${7 - daysSince} days.`);
      }
    }

    // 1. Fetch entries from the last 7 days
    const allEntries = await this.getEntries(userUuid);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const recentEntries = allEntries.filter(e => new Date(e.createdAt) >= oneWeekAgo);

    if (recentEntries.length === 0) {
      throw new Error('Not enough data to generate advice for this week.');
    }

    // 2. Ask AI to generate advice
    this.logger.log(`Generating weekly advice for user ${userUuid} based on ${recentEntries.length} entries.`);
    const result = await this.aiService.generateWeeklyAdvice(recentEntries);

    if (!result) {
      throw new Error('Failed to generate advice from AI.');
    }

    // 3. Save advice to DB
    return await this.adviceRepository.createAdvice(userUuid, result.content, result.relatedTopics);
  }
}
