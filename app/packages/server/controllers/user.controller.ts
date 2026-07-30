import type { Request, Response } from 'express';
import { userService } from '../services/user.service';

export const userController = {
   async list(req: Request, res: Response) {
      try {
         const users = await userService.listUsers();
         return res.json({ users });
      } catch (error) {
         return res.status(500).json({ error: 'Failed to retrieve users' });
      }
   },

   async delete(req: Request, res: Response) {
      try {
         const id = Number(req.params.id);
         if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid user ID' });
         }

         if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
         }

         await userService.deleteUser(id, req.user.id);
         return res.json({ message: 'User deleted successfully' });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to delete user';
         return res.status(400).json({ error: message });
      }
   },
};
