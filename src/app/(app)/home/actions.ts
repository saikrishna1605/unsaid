'use server';

import { chat, ChatInputSchema } from '@/ai/flows/chat-agent';

// Define the shape of the state for useActionState
export interface ChatState {
  messages: { role: 'user' | 'model'; content: string }[];
  error: string | null;
}

export async function sendMessage(
  prevState: ChatState,
  formData: FormData
): Promise<ChatState> {
  
  const validatedFields = ChatInputSchema.pick({ message: true }).safeParse({
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
