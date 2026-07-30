import { type User } from '@prisma/client';
import { prisma } from '../prisma';

export const userRepository = {
   async findByEmail(email: string): Promise<User | null> {
      return prisma.user.findUnique({
         where: { email },
      });
   },

   async findById(id: number): Promise<User | null> {
      return prisma.user.findUnique({
         where: { id },
      });
   },

   async create(data: {
      email: string;
      name: string;
      password: string;
      role: import('@prisma/client').UserRole;
   }): Promise<User> {
      return prisma.user.create({
         data,
      });
   },

   async findAll(): Promise<Omit<User, 'password'>[]> {
      return prisma.user.findMany({
         select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true,
         },
         orderBy: { createdAt: 'desc' },
      });
   },

   async delete(id: number): Promise<void> {
      await prisma.user.delete({
         where: { id },
      });
   },
};
