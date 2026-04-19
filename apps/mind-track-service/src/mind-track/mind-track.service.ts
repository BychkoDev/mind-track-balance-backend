import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MindTrackRepository } from './mind-track.repository';
import { CreateEmotionLogDto } from './dto/create-emotion-log.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MindTrackService {
  private readonly logger = new Logger(MindTrackService.name);

  constructor(
    private readonly repository: MindTrackRepository,
    private readonly aiService: AiService,
  ) {}

  async createEntry(userUuid: string, dto: CreateEmotionLogDto) {
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

  async getEntries(userUuid: string) {
    return await this.repository.findEntries(userUuid);
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
}
