'use server';

/**
 * @fileOverview Interprets a sign language video clip into text.
 *
 * - interpretSignLanguage - A function that handles the sign language interpretation.
 * - InterpretSignLanguageInput - The input type for the interpretSignLanguage function.
 * - InterpretSignLanguageOutput - The return type for the interpretSignLanguage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InterpretSignLanguageInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video of sign language as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type InterpretSignLanguageInput = z.infer<typeof InterpretSignLanguageInputSchema>;

const InterpretSignLanguageOutputSchema = z.object({
  text: z.string().describe('The interpreted text from the sign language video.'),
});
export type InterpretSignLanguageOutput = z.infer<typeof InterpretSignLanguageOutputSchema>;

export async function interpretSignLanguage(input: InterpretSignLanguageInput): Promise<InterpretSignLanguageOutput> {
  return interpretSignLanguageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'interpretSignLanguagePrompt',
  input: {schema: InterpretSignLanguageInputSchema},
  output: {schema: InterpretSignLanguageOutputSchema},
  prompt: `You are an expert American Sign Language (ASL) interpreter. Watch the following video clip and translate the signs into written English text.

Video: {{media url=videoDataUri}}`,
});

const interpretSignLanguageFlow = ai.defineFlow(
  {
    name: 'interpretSignLanguageFlow',
    inputSchema: InterpretSignLanguageInputSchema,
    outputSchema: InterpretSignLanguageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
