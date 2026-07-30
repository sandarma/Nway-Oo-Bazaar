import type { Request, Response, NextFunction } from 'express';

// Simple in-memory rate limiter
const attempts = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

export function rateLimitLogin(
   req: Request,
   res: Response,
   next: NextFunction
) {
   const ip = req.ip || req.socket.remoteAddress || 'unknown';
   const now = Date.now();
   const record = attempts.get(ip);

   // Clean up expired record
   if (record && now > record.resetAt) {
      attempts.delete(ip);
   }

   const current = attempts.get(ip);

   if (current && current.count >= MAX_ATTEMPTS) {
      const minutesLeft = Math.ceil((current.resetAt - now) / 60000);
      return res.status(429).json({
         error: `Too many login attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
      });
   }

   // Track this request (will be incremented on failed login)
   if (!current) {
      attempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
   }

   next();
}

export function recordFailedLogin(ip: string) {
   const now = Date.now();
   const current = attempts.get(ip);

   if (current && now > current.resetAt) {
      attempts.delete(ip);
   }

   const record = attempts.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
   record.count += 1;
   attempts.set(ip, record);
}

export function resetLoginAttempts(ip: string) {
   attempts.delete(ip);
}
