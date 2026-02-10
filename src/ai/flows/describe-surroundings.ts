'use server';

/**
 * @fileOverview Describes the user's surroundings based on a photo, providing text and audio output.
 *
 * - describeSurroundings - A function that handles the scene description process.
 * - DescribeSurroundingsInput - The input type for the describeSurroundings function.
 * - DescribeSurroundingsOutput - The return type for the describeSurroundings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

const DescribeSurroundingsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the user's surroundings as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DescribeSurroundingsInput = z.infer<typeof DescribeSurroundingsInputSchema>;

const DescribeSurroundingsOutputSchema = z.object({
  description: z.string().describe('A textual description of the scene.'),
  audioDescription: z.string().describe('An audio version of the description in base64 encoded WAV format.'),
});
export type DescribeSurroundingsOutput = z.infer<typeof DescribeSurroundingsOutputSchema>;

export async function describeSurroundings(input: DescribeSurroundingsInput): Promise<DescribeSurroundingsOutput> {
  return describeSurroundingsFlow(input);
}

const describePrompt = ai.definePrompt({
    name: 'describeSurroundingsPrompt',
    input: { schema: DescribeSurroundingsInputSchema },
    output: { schema: z.object({ description: z.string() }) },
    prompt: `You are an expert at describing scenes for visually impaired users. Your descriptions should be clear, concise, and focus on the most important elements, including objects, people, and potential obstacles.

    Analyze the following image and provide a helpful description.

    Photo: {{media url=photoDataUri}}`,
});

async function textToSpeech(text: string): Promise<string> {
    const {media} = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: {voiceName: 'Algenib'},
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
        writer.on('data', function (d) {
            bufs.push(d);
        });
        writer.on('end', function () {
            resolve(Buffer.concat(bufs).toString('base64'));
        });

        writer.write(pcmData);
        writer.end();
    });
}

const describeSurroundingsFlow = ai.defineFlow(
  {
    name: 'describeSurroundingsFlow',
    inputSchema: DescribeSurroundingsInputSchema,
    outputSchema: DescribeSurroundingsOutputSchema,
  },
  async input => {
    const {output} = await describePrompt(input);
    if (!output) {
      throw new Error('No description was generated.');
    }

    const audioDescription = await textToSpeech(output.description);

    return {
      description: output.description,
      audioDescription: audioDescription,
    };
  }
);
