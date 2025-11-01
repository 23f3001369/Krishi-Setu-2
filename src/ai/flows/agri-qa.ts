
'use server';
/**
 * @fileOverview A general-purpose agricultural Q&A agent.
 *
 * - agriQa - A function that answers general farming questions.
 * - AgriQaInput - The input type for the function.
 * - AgriQaOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AgriQaInputSchema = z.object({
  question: z.string().describe('The user\'s agricultural question.'),
  language: z.string().optional().describe('The language for the answer (e.g., "Hindi", "Punjabi").'),
});
export type AgriQaInput = z.infer<typeof AgriQaInputSchema>;

const AgriQaOutputSchema = z.object({
  answer: z.string().describe('A detailed answer to the user\'s question.'),
});
export type AgriQaOutput = z.infer<typeof AgriQaOutputSchema>;

export async function agriQa(input: AgriQaInput): Promise<AgriQaOutput> {
  return agriQaFlow(input);
}

const prompt = ai.definePrompt({
  name: 'agriQaPrompt',
  input: { schema: AgriQaInputSchema },
  output: { schema: AgriQaOutputSchema },
  prompt: `You are an expert agricultural advisor named Krishi-Bot. Your role is to provide clear, accurate, and concise answers to general farming questions.

User's Question:
"{{{question}}}"

{{#if language}}
The user has requested the answer in {{language}}. You MUST provide the answer in {{language}}.
{{/if}}

Based on this question, provide a helpful and informative answer.
`,
});

const agriQaFlow = ai.defineFlow(
  {
    name: 'agriQaFlow',
    inputSchema: AgriQaInputSchema,
    outputSchema: AgriQaOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
