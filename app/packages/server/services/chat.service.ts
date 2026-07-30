import fs from 'fs';
import path from 'path';
// import OpenAI from 'openai';
import { conversationRepository } from '../repositories/conversation.repository';
import { llmClient } from '../llm/client';

// implementation details // keep private
// const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Read .txt prompt files via fs (Bun can import .txt directly, Node.js cannot)
// Find prompts dir by trying multiple candidate paths (works in all environments):
//   - Netlify: cwd=/var/task, files at /var/task/app/packages/server/prompts/
//   - Local from app/: cwd=.../app, files at .../app/packages/server/prompts/
//   - Local from server/: cwd=.../packages/server, files at .../packages/server/prompts/
function findPromptsDir(): string {
   const candidates = [
      path.join(process.cwd(), 'app', 'packages', 'server', 'prompts'),
      path.join(process.cwd(), 'packages', 'server', 'prompts'),
      path.join(process.cwd(), 'prompts'),
   ];
   for (const candidate of candidates) {
      if (fs.existsSync(path.join(candidate, 'chatbot.txt'))) {
         return candidate;
      }
   }
   // Fallback: return first candidate (will error with clear message)
   return candidates[0];
}
const promptsDir = findPromptsDir();

const template = fs.readFileSync(path.join(promptsDir, 'chatbot.txt'), 'utf-8');

const extractionTemplate = fs.readFileSync(
   path.join(promptsDir, 'order_extraction.txt'),
   'utf-8'
);

const info = fs.readFileSync(
   path.join(promptsDir, '20June26Event.md'),
   'utf-8'
);

const instructions = template.replace('{{Info}}', info);

type chatResponse = { id: string; message: string };

type ExtractOrderResult = {
   items: {
      name: string;
      quantity: number;
      action: 'add' | 'set' | 'remove';
   }[];

   note: string;
};

// publish the interface of the chat service
export const chatService = {
   async sendMessage(
      prompt: string,
      conversationId: string
   ): Promise<chatResponse> {
      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions,
         prompt,
         temperature: 0.2,
         maxOutputToken: 300,
         previousResponseId:
            conversationRepository.getLastResponseId(conversationId),
      });

      conversationRepository.setLastResponseId(conversationId, response.id);

      return {
         id: response.id,
         message: response.text,
      };
   },
   async extractOrder(
      userText: string,
      menuItems: string[]
   ): Promise<ExtractOrderResult> {
      const menuContext = `Available menu:\n${menuItems.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;

      const response = await llmClient.generateText({
         model: 'gpt-4o-mini',
         instructions: `${extractionTemplate}\n\n${menuContext}`,
         prompt: userText,
         temperature: 0,
         maxOutputToken: 300,
      });

      const raw = response.text?.trim() ?? '{"items":[],"note":""}';
      const cleaned = raw
         .replace(/^```json\s*/i, '')
         .replace(/```$/i, '')
         .trim();

      // const parsed = JSON.parse(raw);
      let parsed: any;
      try {
         parsed = JSON.parse(cleaned);
      } catch {
         return { items: [], note: '' };
      }

      return {
         items: Array.isArray(parsed.items)
            ? parsed.items
                 .map((i: any) => ({
                    name: String(i.name ?? '').trim(),
                    quantity: Number(i.quantity ?? 1),
                    action: ['add', 'set', 'remove'].includes(
                       String(i.action).toLowerCase()
                    )
                       ? String(i.action).toLowerCase()
                       : 'add',
                 }))
                 .filter((i: any) => i.name)
            : [],
         note: typeof parsed.note === 'string' ? parsed.note : '',
      };
   },
};
