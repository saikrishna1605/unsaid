'use server';

import { chat } from '@/ai/flows/chat-agent';
import { z } from 'zod';

// Define the shape of the state for useActionState
export interface ChatState {
  messages: { role: 'user' | 'model'; content: string }[];
  error: string | null;
}

const SendMessageSchema = z.object({
  message: z.string(),
});

export async function sendMessage(
  prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  
  const validatedFields = SendMessageSchema.safeParse({
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      ...prevState,
      error: validatedFields.error.flatten().fieldErrors.message?.[0] || 'Invalid message.',
    };
  }
  
  const userMessage = validatedFields.data.message;

  // Add user message to the state immediately for optimistic UI update
  const newMessages = [...prevState.messages, { role: 'user' as const, content: userMessage }];

  try {
    const result = await chat({
      // Pass previous messages (excluding the last one if it's from the model) as history
      history: prevState.messages,
      message: userMessage,
    });
    
    // Add the model's response
    return {
      messages: [...newMessages, { role: 'model' as const, content: result.response }],
      error: null,
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
    return { 
        ...prevState, // Return previous state on error
        error: `Sorry, I encountered an issue. ${errorMessage}` 
    };
  }
}
