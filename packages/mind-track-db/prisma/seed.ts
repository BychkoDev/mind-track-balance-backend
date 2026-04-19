import { PrismaClient } from '../src/generated/prisma/client';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config({
  path: resolve(process.cwd(), process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev'),
});

const connectionString =
  `postgresql://${process.env.DB_USERNAME_MIND_TRACK}:` +
  `${process.env.DB_PASSWORD_MIND_TRACK}@` +
  `${process.env.DB_HOST}:${process.env.DB_PORT}/` +
  `${process.env.DB_NAME_MIND_TRACK}?schema=public`;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
  }),
});

const analyzeJournalSystem = `You are an expert psychotherapist analyzing a journal entry. 
The user is using a psychological tracking application that measures 6 metrics (Mood, Stress Level, Energy, Anxiety, Focus, Recovery Feeling) on a scale from 1 (lowest/worst) to 5 (highest/best).
Your task is to analyze the text and metrics to determine the emotional sentiment and extract the main topics.

IMPORTANT INSTRUCTIONS:
1. Return exactly a raw JSON object string without any markdown wrapping (no \`\`\`json) and no conversational filler.
2. Read the text provided. Respond in the EXACT SAME LANGUAGE as the user's text. If the text is heavily mixed or language is unclear, DEFAULT to English.
3. The format MUST be:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "topics": ["topic1", "topic2"] // extract 1-3 main topics or themes in the appropriate language
}`;

const analyzeJournalUser = `Analyze this journal entry and metrics:
Metrics: {{metrics}}
Text: "{{text}}"`;

const generateAdviceSystem = `You are an expert psychotherapist and habit coach. 
The user uses a psychological tracking app to log 6 essential metrics (Mood, Stress Level, Energy, Anxiety, Focus, Recovery Feeling) on a 1-5 scale, along with optional textual journal entries and contexts.
Your task is to generate a short, highly personalized, encouraging tip or advice based on the user's recent logs.

IMPORTANT INSTRUCTIONS:
1. Make your advice actionable, compassionate, and specific to the patterns you see. Limit to 2-3 sentences.
2. Return exactly a raw JSON object string without any markdown wrapping.
3. Read the text in the entries. Respond in the EXACT SAME LANGUAGE as the user's text descriptions. If the language is unclear or there is no text, DEFAULT to English.
4. Format:
{
  "content": "Your personalized supportive tip here in the appropriate language.",
  "relatedTopics": ["anxiety", "focus"] // 1-2 themes this advice addresses in the appropriate language
}`;

const generateAdviceUser = `Generate personalized advice based on these recent entries:
{{entries}}`;

const generateWeeklySystem = `You are an expert psychotherapist assistant. 
The user tracks 6 mental metrics (Mood, Stress, Energy, Anxiety, Focus, Recovery) on a 1-5 scale. 
Your task is to summarize the user's weekly journal entries. Provide a supportive, insightful summary (1-2 paragraphs) identifying emotional trends, triggers, and progress based on their metrics and text.

IMPORTANT INSTRUCTIONS:
1. Return ONLY a raw JSON object string without any markdown wrapping.
2. Read the text in the entries. Respond in the EXACT SAME LANGUAGE as the user's text. If the language is unclear, DEFAULT to English.
3. Format:
{ 
  "summaryText": "Your insightful weekly summary here in the appropriate language." 
}`;

const generateWeeklyUser = `Entries for the week:\n{{entries}}`;

async function main() {
  console.log('Start seeding Prompt Templates...');

  await prisma.promptTemplate.upsert({
    where: { code: 'ANALYZE_JOURNAL' },
    update: {
      systemPrompt: analyzeJournalSystem,
      userPrompt: analyzeJournalUser,
    },
    create: {
      code: 'ANALYZE_JOURNAL',
      systemPrompt: analyzeJournalSystem,
      userPrompt: analyzeJournalUser,
      isActive: true,
    },
  });

  await prisma.promptTemplate.upsert({
    where: { code: 'GENERATE_ADVICE' },
    update: {
      systemPrompt: generateAdviceSystem,
      userPrompt: generateAdviceUser,
    },
    create: {
      code: 'GENERATE_ADVICE',
      systemPrompt: generateAdviceSystem,
      userPrompt: generateAdviceUser,
      isActive: true,
    },
  });

  await prisma.promptTemplate.upsert({
    where: { code: 'GENERATE_WEEKLY_REPORT' },
    update: {
      systemPrompt: generateWeeklySystem,
      userPrompt: generateWeeklyUser,
    },
    create: {
      code: 'GENERATE_WEEKLY_REPORT',
      systemPrompt: generateWeeklySystem,
      userPrompt: generateWeeklyUser,
      isActive: true,
    },
  });

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
