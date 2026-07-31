import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Support --env flag: npx tsx prisma/seed.ts --env=uat
const envFlag = process.argv.find((arg) => arg.startsWith('--env='));
const envName = envFlag ? envFlag.split('=')[1] : 'local';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = envName === 'local' ? '.env' : `.env.${envName}`;
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

console.log(`Seeding with: ${envFile}`);
console.log(
   `DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':***@')}`
);

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
