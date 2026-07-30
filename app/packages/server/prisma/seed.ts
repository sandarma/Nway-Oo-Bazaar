import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin(
   email: string,
   password: string,
   name: string = 'Admin'
) {
   if (!email || !password) {
      console.error(`Skipping: email or password not provided`);
      return;
   }

   const existing = await prisma.user.findUnique({
      where: { email },
   });

   if (existing) {
      console.log(`Admin user already exists: ${email}`);
      return;
   }

   const hashedPassword = await bcrypt.hash(password, 10);

   await prisma.user.create({
      data: {
         email,
         name,
         password: hashedPassword,
         role: UserRole.ADMIN,
      },
   });

   console.log(`Admin user created: ${email}`);
}

async function main() {
   // Seed primary admin
   const email = process.env.ADMIN_EMAIL;
   const password = process.env.ADMIN_PASSWORD;
   const name = process.env.ADMIN_NAME || 'Admin';

   // Seed demo admin
   const demoEmail = process.env.ADMIN_DEMO_EMAIL;
   const demoPassword = process.env.ADMIN_DEMO_PASSWORD;
   const demoName = process.env.ADMIN_DEMO_NAME || 'Admin';

   if (!email && !demoEmail) {
      console.error(
         'Error: At least one of ADMIN_EMAIL or ADMIN_DEMO_EMAIL env vars is required.'
      );
      console.error(
         'Run: ADMIN_EMAIL="admin@example.com" ADMIN_PASSWORD="password" npx prisma db seed'
      );
      process.exit(1);
   }

   await seedAdmin(email || '', password || '', name);
   await seedAdmin(demoEmail || '', demoPassword || '', demoName);
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
