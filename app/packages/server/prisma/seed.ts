import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
   const email = process.env.ADMIN_DEMO_EMAIL || process.env.ADMIN_EMAIL;
   const password =
      process.env.ADMIN_DEMO_PASSWORD || process.env.ADMIN_PASSWORD;
   const name =
      process.env.ADMIN_DEMO_NAME || process.env.ADMIN_NAME || 'Admin';

   if (!email || !password) {
      console.error(
         'Error: ADMIN_DEMO_EMAIL and ADMIN_DEMO_PASSWORD env vars are required.'
      );
      console.error(
         'Run: ADMIN_DEMO_EMAIL="admin@example.com" ADMIN_DEMO_PASSWORD="password" npx prisma db seed'
      );
      process.exit(1);
   }

   // Check if admin already exists
   const existing = await prisma.user.findUnique({
      where: { email },
   });

   if (existing) {
      console.log(`Admin user already exists: ${email}`);
      return;
   }

   const hashedPassword = await bcrypt.hash(password, 10);

   const admin = await prisma.user.create({
      data: {
         email,
         name,
         password: hashedPassword,
         role: UserRole.ADMIN,
      },
   });

   // console.log(`Admin user created:`);
   // console.log(`  Email: ${admin.email}`);
   // console.log(`  Name: ${admin.name}`);
   // console.log(`  Role: ${admin.role}`);
   // console.log(`  Password: ${password} (change in production!)`);
}

main()
   .catch((e) => {
      console.error(e);
      process.exit(1);
   })
   .finally(async () => {
      await prisma.$disconnect();
   });
