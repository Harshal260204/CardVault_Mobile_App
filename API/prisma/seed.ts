import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

function applyDatabaseUrlFromParts(): void {
  if (process.env.DATABASE_URL?.trim()) return;
  const keys = ['DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DB_NAME'] as const;
  for (const key of keys) {
    if (!process.env[key]) {
      throw new Error(`Missing ${key} in .env for seed`);
    }
  }
  const user = encodeURIComponent(process.env.DB_USER!);
  const password = encodeURIComponent(process.env.DB_PASSWORD!);
  process.env.DATABASE_URL = `postgresql://${user}:${password}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public`;
}

applyDatabaseUrlFromParts();

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@cardvault.local';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Password123!';
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      fullName: 'Super Admin',
      role: UserRole.super_admin,
      passwordHash,
      isActive: true,
    },
    update: {
      role: UserRole.super_admin,
      passwordHash,
    },
  });

  console.log(`\nSuper Admin seeded: ${admin.email}`);
}

async function main() {
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
