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
  1. Create an audio summary of the article.
  2. Extract key facts from the article.
  3. Generate easy-to-read bullet points summarizing the article.
  4. Generate sign cards (textual representation or links) related to the article content.

  Output the response in the following JSON format:
  {
    "audioSummary": "",
    "easyReadBullets": [""],
    "keyFacts": [""],
    "signCards": [""]
  }`,
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

const summarizeArticleWithSignCardsFlow = ai.defineFlow(
  {
    name: 'summarizeArticleWithSignCardsFlow',
    inputSchema: SummarizeArticleWithSignCardsInputSchema,
    outputSchema: SummarizeArticleWithSignCardsOutputSchema,
  },
  async input => {
    const {output} = await summarizeArticlePrompt(input);

    // Since the prompt asks for a JSON output, but Genkit can't guarantee it,
    // we need to parse the output to ensure it matches the schema.
    if (!output) {
      throw new Error('No output from summarizeArticlePrompt');
    }

    let parsedOutput: SummarizeArticleWithSignCardsOutput;
    try {
      parsedOutput = JSON.parse(output.toString());
    } catch (e) {
      console.error("Failed to parse JSON output: ", output);
      throw e;
    }

    const audioSummary = await textToSpeech(parsedOutput.audioSummary);

    return {
      ...parsedOutput,
      audioSummary,
    };
  }
);
