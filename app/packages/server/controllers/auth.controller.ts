import type { Request, Response } from 'express';
import z from 'zod';
import { authService } from '../services/auth.service';
import {
   recordFailedLogin,
   resetLoginAttempts,
} from '../middleware/rate-limit';

const registerSchema = z.object({
   code: z.string().min(1, 'Invitation code is required'),
   name: z.string().trim().min(1, 'Name is required'),
   email: z.string().email('Invalid email address'),
   password: z.string().min(8, 'Password must be at least 8 characters'),
});

const loginSchema = z.object({
   email: z.string().email('Invalid email address'),
   password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
   refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const authController = {
   async register(req: Request, res: Response) {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const result = await authService.register(parseResult.data);
         return res.status(201).json(result);
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Registration failed';
         return res.status(400).json({ error: message });
      }
   },

   async login(req: Request, res: Response) {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      const ip = req.ip || req.socket.remoteAddress || 'unknown';

      try {
         const { email, password } = parseResult.data;
         const result = await authService.login(email, password);
         resetLoginAttempts(ip);
         return res.json(result);
      } catch (error) {
         recordFailedLogin(ip);
         return res.status(401).json({
            error: 'Invalid email or password. Please try again.',
         });
      }
   },

   async refresh(req: Request, res: Response) {
      const parseResult = refreshSchema.safeParse(req.body);
      if (!parseResult.success) {
         return res.status(400).json({ error: parseResult.error.format() });
      }

      try {
         const result = await authService.refreshToken(
            parseResult.data.refreshToken
         );
         return res.json(result);
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Token refresh failed';
         return res.status(401).json({ error: message });
      }
   },

   async me(req: Request, res: Response) {
      try {
         if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
         }
         const user = await authService.getMe(req.user.id);
         return res.json({ user });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Failed to get user';
         return res.status(500).json({ error: message });
      }
   },

   async logout(req: Request, res: Response) {
      try {
         const { refreshToken } = req.body;
         await authService.logout(refreshToken);
         return res.json({ message: 'Logged out successfully' });
      } catch (error) {
         const message =
            error instanceof Error ? error.message : 'Logout failed';
         return res.status(500).json({ error: message });
      }
   },
};
