'use server';
/**
 * @fileOverview Extracts text from an image and provides an audio version.
 *
 * - readTextFromImage - A function that handles the text extraction and speech synthesis process.
 * - ReadTextFromImageInput - The input type for the readTextFromImage function.
 * - ReadTextFromImageOutput - The return type for the readTextFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

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
  audio: z.string().describe('An audio version of the extracted text in base64 encoded WAV format.'),
});
export type ReadTextFromImageOutput = z.infer<typeof ReadTextFromImageOutputSchema>;

export async function readTextFromImage(input: ReadTextFromImageInput): Promise<ReadTextFromImageOutput> {
  return readTextFromImageFlow(input);
}

const readTextPrompt = ai.definePrompt({
  name: 'readTextFromImagePrompt',
  input: {schema: ReadTextFromImageInputSchema},
  output: {schema: z.object({ text: z.string() }) },
  prompt: `You are an Optical Character Recognition (OCR) expert. Extract all text from the following image.

Photo: {{media url=photoDataUri}}`,
});

async function textToSpeech(text: string): Promise<string> {
    const {media} = await ai.generate({
        model: googleAI.model(process.env.NEXT_PUBLIC_GENKIT_TTS_MODEL || 'gemini-2.5-flash-preview-tts'),
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {voiceName: process.env.NEXT_PUBLIC_GENKIT_TTS_VOICE || 'Algenib'},
                },
            },
        },
        prompt: text,
    });
    if (!media) {
        throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
    );
    return 'data:audio/wav;base64,' + (await toWav(audioBuffer));
}

async function toWav(
    pcmData: Buffer,
    channels = 1,
    rate = 24000,
    sampleWidth = 2
): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({
            channels,
            sampleRate: rate,
            bitDepth: sampleWidth * 8,
        });

        let bufs = [] as any[];
        writer.on('error', reject);
        writer.on('data', function (d: any) {
            bufs.push(d);
        });
        writer.on('end', function () {
            resolve(Buffer.concat(bufs).toString('base64'));
        });

        writer.write(pcmData);
        writer.end();
    });
}

const readTextFromImageFlow = ai.defineFlow(
  {
    name: 'readTextFromImageFlow',
    inputSchema: ReadTextFromImageInputSchema,
    outputSchema: ReadTextFromImageOutputSchema,
  },
  async input => {
    const {output} = await readTextPrompt(input);
    if (!output?.text) {
        // Return empty if no text found, to avoid TTS errors
        return { text: '', audio: '' };
    }
    
    const audio = await textToSpeech(output.text);

    return { 
        text: output.text,
        audio: audio,
    };
  }
);
