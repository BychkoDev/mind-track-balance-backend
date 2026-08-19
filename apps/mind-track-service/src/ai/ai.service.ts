import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MindTrackPrismaService } from '@app/prisma-mind-track';

const FALLBACK_SYSTEM_PROMPT = `You are an empathetic, insightful psychological assistant and life coach. 
Your task is to analyze the text and return exactly a JSON object without any markdown wrapping (no \`\`\`json) and no conversational filler.
DO NOT provide any medical diagnoses or psychotherapeutic advice. If the user mentions crisis-like situations (suicide, severe depression, harm to self or others), respond with a neutral safety message advising them to seek professional help, but format it within the JSON structure.
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
    private readonly prisma: MindTrackPrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini AI Service initialized successfully.');
    } else {
      this.logger.warn('GEMINI_API_KEY is missing. AI analysis will be skipped.');
    }
  }

  async analyzeEntry(entry: any): Promise<{ sentiment: string; topics: string[] } | null> {
    if (!this.genAI) {
      return null;
    }

    try {
      const templateRecord = await (this.prisma as any).promptTemplate.findUnique({
        where: { code: 'ANALYZE_JOURNAL' },
      });

      const systemInstruction =
        templateRecord?.isActive && templateRecord.systemPrompt ? templateRecord.systemPrompt : FALLBACK_SYSTEM_PROMPT;

      const userTemplate =
        templateRecord?.isActive && templateRecord.userPrompt ? templateRecord.userPrompt : FALLBACK_USER_PROMPT;

      const metricsString = `Mood: ${entry.mood}/5 | Stress: ${entry.stressLevel}/5 | Energy: ${entry.energy}/5 | Anxiety: ${entry.anxiety}/5 | Focus: ${entry.focus}/5 | Recovery: ${entry.recoveryFeeling}/5`;

      const prompt = userTemplate
        .replace('{{metrics}}', metricsString)
        .replace('{{text}}', entry.description || 'No text provided');

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

  async generateWeeklyAdvice(entries: any[]): Promise<{ content: string; relatedTopics: string[] } | null> {
    if (!this.genAI || entries.length === 0) return null;

    const systemInstruction = `You are an empathetic, insightful psychological assistant and life coach.
Your task is to analyze a user's journaling entries for the past week.
Identify patterns in their mood, stress, energy, and activities (context/tags).
Provide a concise, highly personalized, and actionable piece of advice (around 3-4 sentences) based on their data.
Also extract 2-4 related topics (e.g. "Work-life balance", "Sleep", "Social connection") from the analysis.
Return exactly a JSON object without markdown formatting:
{
  "content": "Your advice text here...",
  "relatedTopics": ["Topic 1", "Topic 2"]
}`;

    // Format entries into a readable string
    const entriesSummary = entries.map(e => `
Date: ${e.createdAt}
Mood: ${e.mood}/5, Stress: ${e.stressLevel}/5, Energy: ${e.energy}/5
Contexts: ${e.contexts?.join(', ') || 'none'}
Tags: ${e.tags?.map((t: any) => t.name).join(', ') || 'none'}
Text: ${e.description || 'none'}
`).join('\n---\n');

    const prompt = `Here are the user's entries for the week:\n${entriesSummary}\n\nPlease generate the weekly advice JSON.`;

    const result = await this.generateCustomJson(prompt, systemInstruction);
    
    if (result && result.content && Array.isArray(result.relatedTopics)) {
        return {
            content: result.content,
            relatedTopics: result.relatedTopics
        };
    }
    
    this.logger.warn('Failed to generate proper weekly advice JSON from AI');
    return null;
  }

  async generateCustomJson(prompt: string, systemInstruction: string): Promise<any | null> {
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
