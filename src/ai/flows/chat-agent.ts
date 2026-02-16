'use server';

/**
 * @fileOverview A multi-personality chat agent that adapts its tone and understands images.
 *
 * - chat - The main function that orchestrates the chat logic.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Defines the structure of a single message in the chat history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
  imageUrl: z.string().optional().describe("An optional image URL (data URI) associated with the message."),
});

// Input schema for the main chat flow
const ChatInputSchema = z.object({
  history: z.array(ChatMessageSchema),
  message: z.string().describe('The latest text message from the user.'),
  imageUrl: z.string().optional().describe("An optional new image from the user (data URI)."),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

// Output schema for the main chat flow
const ChatOutputSchema = z.object({
  response: z.string().describe('The AI agent\'s response.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// Schema for the tone analysis output
const ToneAnalysisSchema = z.object({
    tone: z.enum(['Friendly', 'Formal', 'Frustrated', 'Inquisitive', 'Neutral'])
        .describe('The primary tone of the user\'s message.'),
});

// A prompt that just analyzes the tone of the user's message
const toneAnalyzerPrompt = ai.definePrompt({
    name: 'toneAnalyzerPrompt',
    input: { schema: z.object({ message: z.string() }) },
    output: { schema: ToneAnalysisSchema },
    prompt: `You are a tone analysis expert. Analyze the following user message and classify its primary tone.
    Available tones are: Friendly, Formal, Frustrated, Inquisitive, Neutral.
    Output only the JSON object with the classified tone.
    
    Message: {{{message}}}
    `,
});

// Define the "sub-agent" personalities
const AGENT_PERSONAS = {
  Friendly: 'You are a warm and friendly AI assistant named Kai. Your goal is to be encouraging and personable. Use emojis occasionally.',
  Formal: 'You are a professional and precise AI assistant. Your responses should be formal, structured, and highly informative.',
  Frustrated: 'You are an empathetic and patient AI assistant named Alex. Acknowledge the user\'s potential frustration and offer calm, clear, step-by-step help.',
  Inquisitive: 'You are an enthusiastic and curious AI assistant named Charlie. Encourage exploration, ask clarifying questions, and share interesting related facts.',
  Neutral: 'You are a helpful and direct AI assistant. Get straight to the point and provide the information requested.',
};

// The main chat flow
const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async (input) => {
    // 1. Analyze the tone of the latest user message (if it exists)
    let tone = 'Neutral';
    if (input.message) {
      const { output: toneOutput } = await toneAnalyzerPrompt({ message: input.message });
      tone = toneOutput?.tone || 'Neutral';
    }
    
    // 2. Select the persona based on the tone
    const systemPrompt = AGENT_PERSONAS[tone as keyof typeof AGENT_PERSONAS];

    // 3. Construct messages and prompt for the multimodal model
    const messages = input.history.map(msg => ({
        role: msg.role,
        content: [
            // Only add text part if content is not empty
            ...(msg.content ? [{ text: msg.content }] : []),
            ...(msg.imageUrl ? [{ media: { url: msg.imageUrl } }] : []),
        ],
    })).filter(msg => msg.content.length > 0); // Ensure we don't send empty messages

    const newPromptParts = [];
    if (input.message) {
        newPromptParts.push({ text: input.message });
    }
    if (input.imageUrl) {
        newPromptParts.push({ media: { url: input.imageUrl } });
    }

    // 4. Generate the response using the selected persona
    const { output } = await ai.generate({
        system: systemPrompt,
        prompt: newPromptParts,
        messages: messages,
    });

    return { response: output || 'I am not sure how to respond to that. Could you please rephrase?' };
  }
);

// Ex-portable wrapper function for the flow
export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}
