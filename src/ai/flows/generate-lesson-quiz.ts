'use server';

/**
 * @fileOverview Generates a multiple-choice quiz based on lesson content.
 *
 * - generateLessonQuiz - A function that handles the quiz generation process.
 * - GenerateLessonQuizInput - The input type for the generateLessonQuiz function.
 * - GenerateLessonQuizOutput - The return type for the generateLessonQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonQuizInputSchema = z.object({
  lessonText: z.string().describe('The text content of the lesson.'),
});
export type GenerateLessonQuizInput = z.infer<typeof GenerateLessonQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe('The quiz question.'),
    options: z.array(z.string()).describe('An array of 4 possible answers.'),
    correctAnswerIndex: z.number().min(0).max(3).describe('The index of the correct answer in the options array.'),
});

const GenerateLessonQuizOutputSchema = z.object({
  quiz: z.array(QuizQuestionSchema).describe('An array of 3-5 quiz questions.'),
});
export type GenerateLessonQuizOutput = z.infer<typeof GenerateLessonQuizOutputSchema>;

export async function generateLessonQuiz(input: GenerateLessonQuizInput): Promise<GenerateLessonQuizOutput> {
  return generateLessonQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonQuizPrompt',
  input: {schema: GenerateLessonQuizInputSchema},
  output: {schema: GenerateLessonQuizOutputSchema},
  prompt: `You are an expert curriculum developer. Based on the following lesson text, create a multiple-choice quiz with 3 to 5 questions to test the user's understanding.

For each question, provide 4 options and identify the index of the correct answer. Ensure the questions are directly related to the provided text.

Lesson Text: {{{lessonText}}}`,
});

const generateLessonQuizFlow = ai.defineFlow(
  {
    name: 'generateLessonQuizFlow',
    inputSchema: GenerateLessonQuizInputSchema,
    outputSchema: GenerateLessonQuizOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
