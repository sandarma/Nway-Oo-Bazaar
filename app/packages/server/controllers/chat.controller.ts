import type { Request, Response } from 'express';
import z from 'zod';
import { chatService } from '../services/chat.service';

// implementation details // keep private
const chatRequestSchema = z.object({
   prompt: z
      .string()
      .trim()
      .min(1, 'Prompt is required')
      .max(100, 'Prompt is too long (100 characters max)'),
   conversationId: z.string().uuid('Invalid conversation ID format'),
});

const extractOrderRequestSchema = z.object({
   prompt: z.string().trim().min(1, 'Prompt is required'),
   menuItems: z.array(z.string()).min(1),
});

// public interface of the chat controller
export const chatController = {
   async sendMessage(req: Request, res: Response) {
      const parseResult = chatRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const { prompt, conversationId } = req.body;

         const response = await chatService.sendMessage(prompt, conversationId);

         res.json({ message: response.message });
      } catch (error) {
         res.status(500).json({ error: 'Failed to generate a response.' });
      }
   },
   async extractOrder(req: Request, res: Response) {
      const parsed = extractOrderRequestSchema.safeParse(req.body);
      if (!parsed.success) {
         return res.status(400).json({ error: parsed.error.format() });
      }

      try {
         const result = await chatService.extractOrder(
            parsed.data.prompt,
            parsed.data.menuItems
         );
         return res.json(result);
      } catch (error) {
         return res.status(500).json({ error: 'Failed to extract order.' });
      }
   },
};
