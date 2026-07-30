import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
   id: number;
   email: string;
   role: string;
}

function getJwtSecret(): string {
   // Load from env; Bun's process.env typing requires explicit handling
   const env = process.env as Record<string, string | undefined>;
   const secret = env['JWT_SECRET'];
   if (!secret) {
      throw new Error('JWT_SECRET env var is required');
   }
   return secret;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
   const authHeader = req.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
   }

   const token = authHeader.split(' ')[1];

   try {
      const decoded =
         // @ts-expect-error -- Bun process.env types conflict with jsonwebtoken
         jwt.verify(token, getJwtSecret()) as unknown as JwtPayload;
      req.user = {
         id: decoded.id,
         email: decoded.email,
         role: decoded.role as import('@prisma/client').UserRole,
      };
      next();
   } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
   }
}
