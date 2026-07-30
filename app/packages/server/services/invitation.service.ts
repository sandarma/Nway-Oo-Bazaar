import crypto from 'crypto';
import { invitationRepository } from '../repositories/invitation.repository';

function generateCode(): string {
   return crypto
      .randomBytes(9)
      .toString('base64url')
      .toUpperCase()
      .slice(0, 12);
}

export const invitationService = {
   async create(data: {
      email?: string;
      role: import('@prisma/client').UserRole;
      createdBy: number;
   }) {
      const code = generateCode();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

      const invitation = await invitationRepository.create({
         code,
         email: data.email,
         role: data.role,
         createdBy: data.createdBy,
         expiresAt,
      });

      return invitation;
   },

   async list() {
      return invitationRepository.findAll();
   },

   async revoke(id: number) {
      const invitation = await invitationRepository.findById(id);
      if (!invitation) {
         throw new Error('Invitation not found');
      }
      if (invitation.usedAt) {
         throw new Error('Cannot revoke a used invitation');
      }
      await invitationRepository.delete(id);
   },

   async checkStatus(code: string) {
      const invitation = await invitationRepository.findByCode(code);

      if (!invitation) {
         return { valid: false, reason: 'Invalid invitation code' };
      }

      if (invitation.usedAt) {
         return {
            valid: false,
            reason: 'Invitation code has already been used',
         };
      }

      if (new Date() > invitation.expiresAt) {
         return { valid: false, reason: 'Invitation code has expired' };
      }

      return { valid: true, role: invitation.role };
   },
};
