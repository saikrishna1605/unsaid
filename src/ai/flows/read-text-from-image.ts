'use server';
/**
 * @fileOverview Extracts text from an image.
 *
 * - readTextFromImage - A function that handles the text extraction process.
 * - ReadTextFromImageInput - The input type for the readTextFromImage function.
 * - ReadTextFromImageOutput - The return type for the readTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReadTextFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ReadTextFromImageInput = z.infer<typeof ReadTextFromImageInputSchema>;

const ReadTextFromImageOutputSchema = z.object({
  text: z.string().describe('The text extracted from the image.'),
});
export type ReadTextFromImageOutput = z.infer<typeof ReadTextFromImageOutputSchema>;

export async function readTextFromImage(input: ReadTextFromImageInput): Promise<ReadTextFromImageOutput> {
  return readTextFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'readTextFromImagePrompt',
  input: {schema: ReadTextFromImageInputSchema},
  output: {schema: ReadTextFromImageOutputSchema},
  prompt: `You are an Optical Character Recognition (OCR) expert. Extract all text from the following image.

Photo: {{media url=photoDataUri}}`,
});

const readTextFromImageFlow = ai.defineFlow(
  {
    name: 'readTextFromImageFlow',
    inputSchema: ReadTextFromImageInputSchema,
    outputSchema: ReadTextFromImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
