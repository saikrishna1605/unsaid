'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-easy-read-version.ts';
import '@/ai/flows/daily-reflection-ai.ts';
import '@/ai/flows/summarize-article-with-sign-cards.ts';
import '@/ai/flows/chat-agent.ts';
import '@/ai/flows/read-text-from-image.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/interpret-sign-language.ts';
import '@/ai/flows/describe-surroundings.ts';
import '@/ai/flows/generate-lesson-quiz.ts';
