'use server';

/**
 * @fileOverview A daily reflection AI agent that provides tentative, open to validation, and non-judgmental reflections on user input.
 *
 * - dailyReflection - A function that processes user input and returns an AI-generated reflection.
 * - DailyReflectionInput - The input type for the dailyReflection function.
 * - DailyReflectionOutput - The return type for the dailyReflection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DailyReflectionInputSchema = z.object({
  input: z
    .string()
    .describe(
      'The user input, which can be a word, voice data URI, sign data URI, or indication of silence.'
    ),
});
export type DailyReflectionInput = z.infer<typeof DailyReflectionInputSchema>;

const DailyReflectionOutputSchema = z.object({
  reflection: z
    .string()
    .describe(
      'The AI-generated reflection on the user input, designed to be tentative, open to validation, and non-judgmental.'
    ),
});
export type DailyReflectionOutput = z.infer<typeof DailyReflectionOutputSchema>;

export async function dailyReflection(input: DailyReflectionInput): Promise<DailyReflectionOutput> {
  return dailyReflectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dailyReflectionPrompt',
  input: {schema: DailyReflectionInputSchema},
  output: {schema: DailyReflectionOutputSchema},
  prompt: `You are a supportive AI companion designed to provide reflections on user input. The input can be a single word, a voice recording, a sign language video, or even silence.

  Your reflections should be:
  - Tentative: Offer possible interpretations rather than definitive statements.
  - Open to validation: Encourage the user to confirm or deny the accuracy of the reflection.
  - Non-judgmental: Avoid any form of criticism, advice, or evaluation.

  Here's the user's input: {{{input}}}

  Provide a brief reflection that embodies these qualities.`,
});

const dailyReflectionFlow = ai.defineFlow(
  {
    name: 'dailyReflectionFlow',
    inputSchema: DailyReflectionInputSchema,
    outputSchema: DailyReflectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
