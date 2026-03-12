import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { MindTrackRepository } from './mind-track.repository';
import { CreateEntryDto } from './dto/create-entry.dto';
import { UpdateEntryDto } from './dto/update-entry.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class MindTrackService {
  private readonly logger = new Logger(MindTrackService.name);

  constructor(
    private readonly repository: MindTrackRepository,
    private readonly aiService: AiService,
  ) {}

  async createEntry(userUuid: string, dto: CreateEntryDto) {
    // 1. Збереження запису
    const entry = await this.repository.createEntry(userUuid, dto);

    // 2. Асинхронний бекграунд-запуск AI (fire-and-forget)
    if (dto.text && dto.text.trim().length > 0) {
      this.analyzeAndSave(entry.uuid, userUuid, dto.text).catch((err) =>
        this.logger.error('Background AI analysis failed', err),
      );
    }

    return entry;
  }

  private async analyzeAndSave(
    entryUuid: string,
    userUuid: string,
    text: string,
  ) {
    this.logger.log(`Starting AI analysis for entry ${entryUuid}`);
    const result = await this.aiService.analyzeText(text);

    if (result) {
      this.logger.log(
        `AI Analysis complete for ${entryUuid}. Sentiment: ${result.sentiment}`,
      );
      
      // Зберігаємо результати аналізу
      await this.repository.updateEntry(entryUuid, userUuid, {
        aiSentiment: result.sentiment,
        aiTopics: result.topics,
      } as any); // Type cast until we update UpdateEntryDto
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
    await this.getEntryById(uuid, userUuid); // Check exists
    return await this.repository.updateEntry(uuid, userUuid, dto);
  }

  async deleteEntry(uuid: string, userUuid: string) {
    await this.getEntryById(uuid, userUuid); // Check exists
    return await this.repository.deleteEntry(uuid, userUuid);
  }
}
