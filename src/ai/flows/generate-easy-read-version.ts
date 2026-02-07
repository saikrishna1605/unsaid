'use server';

/**
 * @fileOverview A flow that generates an easy-to-read version of a given text.
 *
 * - generateEasyReadVersion - A function that handles the generation of the easy-to-read version.
 * - GenerateEasyReadVersionInput - The input type for the generateEasyReadVersion function.
 * - GenerateEasyReadVersionOutput - The return type for the generateEasyReadVersion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEasyReadVersionInputSchema = z.object({
  text: z
    .string()
    .describe('The text to be converted into an easy-to-read version.'),
});
export type GenerateEasyReadVersionInput = z.infer<
  typeof GenerateEasyReadVersionInputSchema
>;

const GenerateEasyReadVersionOutputSchema = z.object({
  easyReadVersion: z
    .string()
    .describe('The easy-to-read version of the input text.'),
});
export type GenerateEasyReadVersionOutput = z.infer<
  typeof GenerateEasyReadVersionOutputSchema
>;

export async function generateEasyReadVersion(
  input: GenerateEasyReadVersionInput
): Promise<GenerateEasyReadVersionOutput> {
  return generateEasyReadVersionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEasyReadVersionPrompt',
  input: {schema: GenerateEasyReadVersionInputSchema},
  output: {schema: GenerateEasyReadVersionOutputSchema},
  prompt: `You are an expert in simplifying complex text into an easy-to-read format.

  Please convert the following text into an easy-to-read version, suitable for people with learning disabilities or those who prefer simpler language. Maintain the original meaning and intent.

  Text: {{{text}}}`,
});

const generateEasyReadVersionFlow = ai.defineFlow(
  {
    name: 'generateEasyReadVersionFlow',
    inputSchema: GenerateEasyReadVersionInputSchema,
    outputSchema: GenerateEasyReadVersionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
