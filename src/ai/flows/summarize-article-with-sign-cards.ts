'use server';

/**
 * @fileOverview Summarizes a news article into an audio summary, easy-to-read bullet points, key facts, and Sign Cards.
 *
 * - summarizeArticleWithSignCards - A function that summarizes the article and generates related content.
 * - SummarizeArticleWithSignCardsInput - The input type for the summarizeArticleWithSignCards function.
 * - SummarizeArticleWithSignCardsOutput - The return type for the summarizeArticleWithSignCards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import wav from 'wav';

const SummarizeArticleWithSignCardsInputSchema = z.object({
  articleText: z.string().describe('The text content of the news article.'),
});
export type SummarizeArticleWithSignCardsInput = z.infer<typeof SummarizeArticleWithSignCardsInputSchema>;

const SummarizeArticleWithSignCardsOutputSchema = z.object({
  audioSummary: z.string().describe('An audio summary of the article in base64 encoded WAV format.'),
  easyReadBullets: z.array(z.string()).describe('Easy-to-read bullet points summarizing the article.'),
  keyFacts: z.array(z.string()).describe('Key facts extracted from the article.'),
  signCards: z.array(z.string()).describe('Sign cards (textual representation or links) related to the article content.'),
});
export type SummarizeArticleWithSignCardsOutput = z.infer<typeof SummarizeArticleWithSignCardsOutputSchema>;

export async function summarizeArticleWithSignCards(
  input: SummarizeArticleWithSignCardsInput
): Promise<SummarizeArticleWithSignCardsOutput> {
  return summarizeArticleWithSignCardsFlow(input);
}

const summarizeArticlePrompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeArticleWithSignCardsInputSchema},
  output: {schema: SummarizeArticleWithSignCardsOutputSchema},
  prompt: `You are an AI assistant that summarizes news articles and generates related content in various formats.

  Article Text: {{{articleText}}}

  Instructions:
  1. Create a text summary of the article, suitable for text-to-speech. This will be the value for 'audioSummary'.
  2. Extract key facts from the article.
  3. Generate easy-to-read bullet points summarizing the article.
  4. Generate sign cards (textual representation or links) related to the article content.

  Output the response in a valid JSON format that matches the provided schema.`,
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

const summarizeArticleWithSignCardsFlow = ai.defineFlow(
  {
    name: 'summarizeArticleWithSignCardsFlow',
    inputSchema: SummarizeArticleWithSignCardsInputSchema,
    outputSchema: SummarizeArticleWithSignCardsOutputSchema,
  },
  async input => {
    const {output} = await summarizeArticlePrompt(input);

    if (!output) {
      throw new Error('No output from summarizeArticlePrompt');
    }

    // The output from a prompt with an outputSchema is already a parsed JS object.
    // The `audioSummary` field at this point is the text we want to convert to speech.
    const textForAudio = output.audioSummary;

    const audioSummary = await textToSpeech(textForAudio);

    return {
      ...output,
      audioSummary, // Replace the text summary with the audio data URI
    };
  }
);
