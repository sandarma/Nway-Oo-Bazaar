import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '@prisma/client';

export function requireRole(...roles: UserRole[]) {
   return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
         return res.status(401).json({ error: 'Authentication required' });
      }

      if (roles.length > 0 && !roles.includes(req.user.role)) {
         return res.status(403).json({ error: 'Insufficient permissions' });
      }

      next();
   };
}
