import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type GenerateTypeOptions = {
   model?: string;
   prompt: string;
   instructions?: string;
   temperature?: number;
   maxOutputToken?: number;
   previousResponseId?: string;
};

type GenerateTextResult = {
   id: string;
   text: string;
};

export const llmClient = {
   async generateText({
      model = 'gpt-4o-mini',
      prompt,
      instructions,
      temperature = 0.2,
      maxOutputToken = 100,
      previousResponseId,
   }: GenerateTypeOptions): Promise<GenerateTextResult> {
      const response = await client.responses.create({
         model,
         input: prompt,
         instructions,
         temperature,
         max_output_tokens: maxOutputToken,
         previous_response_id: previousResponseId,
      });
      return { id: response.id, text: response.output_text };
   },
};
