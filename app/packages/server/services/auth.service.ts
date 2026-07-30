import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/user.repository';
import { invitationRepository } from '../repositories/invitation.repository';

function getEnv(name: string): string {
   const env = process.env as Record<string, string | undefined>;
   const value = env[name];
   if (!value) {
      throw new Error(`${name} env var is required`);
   }
   return value;
}

const JWT_SECRET = getEnv('JWT_SECRET');
const JWT_REFRESH_SECRET = getEnv('JWT_REFRESH_SECRET');
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 10;

function generateTokens(user: { id: number; email: string; role: string }) {
   const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
   );

   const refreshToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
   );

   return { accessToken, refreshToken };
}

export const authService = {
   async register(data: {
      code: string;
      name: string;
      email: string;
      password: string;
   }) {
      // Find and validate invitation
      const invitation = await invitationRepository.findByCode(data.code);

      if (!invitation) {
         throw new Error('Invalid invitation code');
      }

      if (invitation.usedAt) {
         throw new Error('Invitation code has already been used');
      }

      if (new Date() > invitation.expiresAt) {
         throw new Error('Invitation code has expired');
      }

      if (
         invitation.email &&
         invitation.email.toLowerCase() !== data.email.toLowerCase()
      ) {
         throw new Error('Invitation code is restricted to a different email');
      }

      // Check if email already exists
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
         throw new Error('Email already registered');
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

      const user = await userRepository.create({
         email: data.email,
         name: data.name,
         password: hashedPassword,
         role: invitation.role,
      });

      // Mark invitation as used
      await invitationRepository.markUsed(invitation.id, user.id);

      // Generate tokens
      const tokens = generateTokens(user);

      return {
         user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
         },
         ...tokens,
      };
   },

   async login(email: string, password: string) {
      const user = await userRepository.findByEmail(email);
      if (!user) {
         throw new Error('Invalid email or password');
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
         throw new Error('Invalid email or password');
      }

      const tokens = generateTokens(user);

      return {
         user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
         },
         ...tokens,
      };
   },

   async refreshToken(refreshToken: string) {
      try {
         const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
            id: number;
            email: string;
            role: string;
         };

         const user = await userRepository.findById(decoded.id);
         if (!user) {
            throw new Error('User not found');
         }

         const tokens = generateTokens(user);

         return {
            user: {
               id: user.id,
               email: user.email,
               name: user.name,
               role: user.role,
            },
            ...tokens,
         };
      } catch {
         throw new Error('Invalid or expired refresh token');
      }
   },

   async getMe(userId: number) {
      const user = await userRepository.findById(userId);
      if (!user) {
         throw new Error('User not found');
      }

      return {
         id: user.id,
         email: user.email,
         name: user.name,
         role: user.role,
      };
   },

   async logout(_refreshToken: string) {
      // In a production app, you would invalidate the refresh token
      // by storing it in a blacklist or removing from a token table.
      // For now, we just return success — the client clears tokens.
      return { message: 'Logged out successfully' };
   },
};
