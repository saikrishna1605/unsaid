import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [googleAI()],
  model: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'googleai/gemini-2.5-flash',
});
