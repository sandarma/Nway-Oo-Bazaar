import type { Request, Response } from 'express';
import z from 'zod';
import { invitationService } from '../services/invitation.service';

const createInvitationSchema = z.object({
   email: z.string().email('Invalid email address').optional(),
   role: z.enum(['ADMIN', 'ORGANIZER']).default('ORGANIZER'),
});

export const invitationController = {
   async create(req: Request, res: Response) {
      const parseResult = createInvitationSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
         }

         const invitation = await invitationService.create({
            ...parseResult.data,
            createdBy: req.user.id,
         });

         return res.status(201).json({ invitation });
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Failed to create invitation';
         return res.status(500).json({ error: message });
      }
   },

   async list(req: Request, res: Response) {
      try {
         const invitations = await invitationService.list();
         return res.json({ invitations });
      } catch (error) {
         return res
            .status(500)
            .json({ error: 'Failed to retrieve invitations' });
      }
   },

   async revoke(req: Request, res: Response) {
      try {
         const id = Number(req.params.id);
         if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid invitation ID' });
         }

         await invitationService.revoke(id);
         return res.json({ message: 'Invitation revoked successfully' });
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Failed to revoke invitation';
         return res.status(400).json({ error: message });
      }
   },

   async checkStatus(req: Request, res: Response) {
      try {
         const code = req.params.code;
         if (!code) {
            return res
               .status(400)
               .json({ error: 'Invitation code is required' });
         }

         const result = await invitationService.checkStatus(code);
         return res.json(result);
      } catch (error) {
         const message =
            error instanceof Error
               ? error.message
               : 'Failed to check invitation status';
         return res.status(400).json({ error: message });
      }
   },
};
