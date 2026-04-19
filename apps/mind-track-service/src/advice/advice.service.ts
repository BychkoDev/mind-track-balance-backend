import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AdviceRepository } from './advice.repository';
import { MindTrackRepository } from '../mind-track/mind-track.repository';
import { AiService } from '../ai/ai.service';
import { MindTrackPrismaService } from '@app/prisma-mind-track';

@Injectable()
export class AdviceService {
  private readonly logger = new Logger(AdviceService.name);

  constructor(
    private readonly repository: AdviceRepository,
    private readonly mindTrackRepository: MindTrackRepository,
    private readonly aiService: AiService,
    private readonly prisma: MindTrackPrismaService,
  ) {}

  async getAdvices(userUuid: string) {
    return await this.repository.findAdvices(userUuid);
  }

  async markAdviceAsRead(uuid: string, userUuid: string) {
    try {
      return await this.repository.markAsRead(uuid, userUuid);
    } catch (e) {
      throw new NotFoundException('Пораду не знайдено');
    }
  }

  // This can be triggered manually by the user or via a Cron job later
  async generateAdviceForUser(userUuid: string) {
    this.logger.log(`Starting Advice Generation for user: ${userUuid}`);

    // Fetch the last 7 entries to give the AI some context
    const recentEntries = await this.mindTrackRepository.findEntries(userUuid);
    const last7Entries = recentEntries.slice(0, 7);

    if (last7Entries.length === 0) {
      this.logger.warn(`No entries found for user ${userUuid}. Skipping advice generation.`);
      return null;
    }

    // Format the entries for the prompt
    const entriesContext = last7Entries
      .map(
        (e) =>
          `Date: ${e.createdAt.toISOString()} | Mood: ${e.mood}/5 | Stress: ${e.stressLevel}/5 | Energy: ${e.energy}/5 | Anxiety: ${e.anxiety}/5 | Focus: ${e.focus}/5 | Recovery: ${e.recoveryFeeling}/5 | Description: ${e.description || 'None'} | Contexts: ${e.contexts?.join(',') || 'None'} | Sentiment: ${e.aiSentiment} | Topics: ${e.aiTopics.join(',')}`,
      )
      .join('\n---\n');

    // Fetch template from DB or use fallback
    const templateRecord = await (this.prisma as any).promptTemplate.findUnique({
      where: { code: 'GENERATE_ADVICE' },
    });

    const systemInstruction =
      templateRecord?.isActive && templateRecord.systemPrompt
        ? templateRecord.systemPrompt
        : `You are an expert psychotherapist and habit coach. Your task is to generate a short, personalized, encouraging tip or advice based on the user's recent journal entries. 
Return exactly a JSON object without markdown wrapping.
Format:
{
  "content": "Your personalized supportive tip here (2-3 sentences max).",
  "relatedTopics": ["anxiety", "focus"] // 1-2 themes this advice addresses
}`;

    const userTemplate =
      templateRecord?.isActive && templateRecord.userPrompt
        ? templateRecord.userPrompt
        : `Generate advice based on these recent entries:\n{{entries}}`;

    const prompt = userTemplate.replace('{{entries}}', entriesContext);

    try {
      // We will add a method to AiService to generic generate content, or we can just inject GenAI here.
      // Since AiService handles the genAI instance, let's expose a raw generic method there.
      const result = await this.aiService.generateCustomJson(prompt, systemInstruction);

      if (!result) return null;

      const advice = await this.repository.createAdvice(
        userUuid,
        result.content,
        result.relatedTopics || [],
      );

      return advice;
    } catch (error) {
      this.logger.error('Failed to generate advice from Gemini', error);
      return null;
    }
  }
}
