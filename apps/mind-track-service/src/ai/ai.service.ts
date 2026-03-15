import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '@app/common';

const FALLBACK_SYSTEM_PROMPT = `You are an expert psychotherapist analyzing a journal entry. 
Your task is to analyze the text and return exactly a JSON object without any markdown wrapping (no \`\`\`json) and no conversational filler.
Format:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "topics": ["topic1", "topic2"] // extract 1-3 main topics or themes
}`;

const FALLBACK_USER_PROMPT = `Analyze this journal entry:\n"{{text}}"`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI Service initialized successfully.');
    } else {
      this.logger.warn(
        'GEMINI_API_KEY is missing. AI analysis will be skipped.',
      );
    }
  }

  async analyzeText(
    text: string,
  ): Promise<{ sentiment: string; topics: string[] } | null> {
    if (!this.genAI || !text || text.trim().length === 0) {
      return null;
    }

    try {
      const templateRecord = await (this.prisma as any).promptTemplate.findUnique({
        where: { code: 'ANALYZE_JOURNAL' },
      });

      const systemInstruction =
        templateRecord?.isActive && templateRecord.systemPrompt
          ? templateRecord.systemPrompt
          : FALLBACK_SYSTEM_PROMPT;

      const userTemplate =
        templateRecord?.isActive && templateRecord.userPrompt
          ? templateRecord.userPrompt
          : FALLBACK_USER_PROMPT;

      const prompt = userTemplate.replace('{{text}}', text);

      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const cleanText = responseText.replace(/```json\n?|\n?```/gi, '').trim();
        const parsed = JSON.parse(cleanText);
        
        return {
          sentiment: parsed.sentiment || 'NEUTRAL',
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        };
      } catch (parseError) {
        this.logger.error('Failed to parse Gemini response as JSON', parseError);
        this.logger.debug('Raw response was: ' + responseText);
        return null;
      }
    } catch (error) {
      this.logger.error('Error calling Gemini API', error);
      return null;
    }
  }

  async generateCustomJson(
    prompt: string,
    systemInstruction: string,
  ): Promise<any | null> {
    if (!this.genAI || !prompt || prompt.trim().length === 0) {
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      try {
        const cleanText = responseText.replace(/```json\n?|\n?```/gi, '').trim();
        return JSON.parse(cleanText);
      } catch (parseError) {
        this.logger.error('Failed to parse Gemini custom response as JSON', parseError);
        this.logger.debug('Raw response was: ' + responseText);
        return null;
      }
    } catch (error) {
      this.logger.error('Error generating custom AI content', error);
      return null;
    }
  }
}
