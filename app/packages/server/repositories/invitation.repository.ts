import { type Invitation } from '@prisma/client';
import { prisma } from '../prisma';

export const invitationRepository = {
   async findByCode(code: string): Promise<Invitation | null> {
      return prisma.invitation.findUnique({
         where: { code },
      });
   },

   async findById(id: number): Promise<Invitation | null> {
      return prisma.invitation.findUnique({
         where: { id },
      });
   },

   async create(data: {
      code: string;
      email?: string;
      role: import('@prisma/client').UserRole;
      createdBy: number;
      expiresAt: Date;
   }): Promise<Invitation> {
      return prisma.invitation.create({
         data,
      });
   },

   async findAll(): Promise<Invitation[]> {
      return prisma.invitation.findMany({
         orderBy: { createdAt: 'desc' },
      });
   },

   async markUsed(id: number, userId: number): Promise<void> {
      await prisma.invitation.update({
         where: { id },
         data: {
            usedAt: new Date(),
            usedBy: userId,
         },
      });
   },

   async delete(id: number): Promise<void> {
      await prisma.invitation.delete({
         where: { id },
      });
   },
};
