'use server';

/**
 * @fileOverview Generates a series of sign language concept cards from text.
 *
 * - generateSignCardsFromText - A function that handles the sign card generation.
 * - GenerateSignCardsFromTextInput - The input type for the function.
 * - GenerateSignCardsFromTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSignCardsFromTextInputSchema = z.object({
  text: z.string().describe('The text to be converted into sign cards.'),
});
export type GenerateSignCardsFromTextInput = z.infer<typeof GenerateSignCardsFromTextInputSchema>;

const GenerateSignCardsFromTextOutputSchema = z.object({
  signCards: z.array(z.string()).describe('An array of key concepts from the text, to be represented as sign cards.'),
});
export type GenerateSignCardsFromTextOutput = z.infer<typeof GenerateSignCardsFromTextOutputSchema>;

export async function generateSignCardsFromText(input: GenerateSignCardsFromTextInput): Promise<GenerateSignCardsFromTextOutput> {
  return generateSignCardsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSignCardsPrompt',
  input: {schema: GenerateSignCardsFromTextInputSchema},
  output: {schema: GenerateSignCardsFromTextOutputSchema},
  prompt: `You are an expert in linguistics and sign language. Analyze the following text and break it down into a series of individual concepts or words that can be represented as sign language flashcards.

Focus on the most important keywords and ideas.

Text: {{{text}}}`,
});

const generateSignCardsFlow = ai.defineFlow(
  {
    name: 'generateSignCardsFlow',
    inputSchema: GenerateSignCardsFromTextInputSchema,
    outputSchema: GenerateSignCardsFromTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
