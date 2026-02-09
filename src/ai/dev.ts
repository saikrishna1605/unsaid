'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-easy-read-version.ts';
import '@/ai/flows/daily-reflection-ai.ts';
import '@/ai/flows/summarize-article-with-sign-cards.ts';
import '@/ai/flows/chat-agent.ts';
import '@/ai/flows/read-text-from-image.ts';
