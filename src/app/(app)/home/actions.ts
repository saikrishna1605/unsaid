'use server';

import { dailyReflection } from '@/ai/flows/daily-reflection-ai';
import { z } from 'zod';

const schema = z.object({
  input: z.string().min(1, { message: 'Input cannot be empty.' }),
});

export async function getReflection(
  currentState: { reflection: string; error: string | null },
  formData: FormData
) {
  const validatedFields = schema.safeParse({
    input: formData.get('input'),
  });

  if (!validatedFields.success) {
    return {
      reflection: '',
      error: validatedFields.error.flatten().fieldErrors.input?.[0] || 'Invalid input.',
    };
  }
  
  const input = validatedFields.data.input;

  try {
    // Adding a slight delay to show the loading spinner
    await new Promise(resolve => setTimeout(resolve, 500));
    const result = await dailyReflection({ input });
    return { reflection: result.reflection, error: null };
  } catch (e) {
    console.error(e);
    return { reflection: '', error: 'I am here to listen, but I had a little trouble understanding. Could we try again?' };
  }
}
