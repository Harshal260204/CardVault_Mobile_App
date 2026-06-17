import { CaptureMode, LeadQualifier, PrismaClient, UserRole } from '@prisma/client';
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

const DEMO_PASSWORD = 'Password123!';

const PRODUCT_PLANS = [
  {
    id: '00000000-0000-4000-9000-000000000001',
    code: 'free',
    name: 'Free',
    priceInr: 0,
    billingInterval: null,
    description: 'Free plan for the entire CardVault product.',
  },
  {
    id: '00000000-0000-4000-9000-000000000002',
    code: 'pro',
    name: 'Pro',
    priceInr: 99,
    billingInterval: 'monthly',
    description: 'Paid CardVault plan billed at 99 Rs per month.',
  },
] as const;

const ORGS = [
  {
    slug: 'cardvault-demo',
    name: 'CardVault Demo',
    plan: 'pro',
    users: [
      { email: 'employee@cardvault.local', fullName: 'Sales Employee', role: UserRole.employee },
      { email: 'manager@cardvault.local', fullName: 'Org Manager', role: UserRole.manager },
      { email: 'admin@cardvault.local', fullName: 'Super Admin', role: UserRole.platform_super_admin },
    ],
    sessionId: '00000000-0000-4000-8000-000000000001',
    contactIds: [
      '00000000-0000-4000-8001-000000000001',
      '00000000-0000-4000-8001-000000000002',
      '00000000-0000-4000-8001-000000000003',
    ],
  },
  {
    slug: 'acme-demo',
    name: 'Acme Corp Demo',
    plan: 'free',
    users: [
      { email: 'employee@acme.local', fullName: 'Acme Sales Rep', role: UserRole.employee },
      { email: 'manager@acme.local', fullName: 'Acme Manager', role: UserRole.manager },
    ],
    sessionId: '00000000-0000-4000-8000-000000000002',
    contactIds: [
      '00000000-0000-4000-8002-000000000001',
      '00000000-0000-4000-8002-000000000002',
    ],
  },
] as const;

const DEMO_CONTACTS_CARDVAULT: DemoContact[] = [
  {
    fullName: 'Alex Rivera',
    company: 'Northwind Logistics',
    title: 'VP Partnerships',
    emails: ['alex.rivera@northwind.io'],
    phones: ['+1-555-0101'],
    captureMode: CaptureMode.visitor,
    leadQualifier: LeadQualifier.hot,
    tags: ['trade-show', 'priority'],
  },
  {
    fullName: 'Priya Shah',
    company: 'Helix Biotech',
    title: 'Director of Sales',
    emails: ['priya@helixbio.com'],
    phones: ['+1-555-0102'],
    captureMode: CaptureMode.exhibitor,
    leadQualifier: LeadQualifier.warm,
    tags: ['expo-hall'],
  },
  {
    fullName: 'Jordan Lee',
    company: 'Summit Capital',
    title: 'Associate',
    emails: ['jordan.lee@summit.cap'],
    phones: [],
    captureMode: CaptureMode.quick_capture,
    leadQualifier: LeadQualifier.cold,
    tags: ['hallway'],
  },
];

const DEMO_CONTACTS_ACME: DemoContact[] = [
  {
    fullName: 'Sam Taylor',
    company: 'Acme Industries',
    title: 'Buyer',
    emails: ['sam@acme-industries.com'],
    phones: ['+1-555-0201'],
    captureMode: CaptureMode.visitor,
    leadQualifier: LeadQualifier.warm,
    tags: ['acme'],
  },
  {
    fullName: 'Riley Chen',
    company: 'Chen Supply',
    title: 'Owner',
    emails: ['riley@chen.supply'],
    phones: ['+1-555-0202'],
    captureMode: CaptureMode.exhibitor,
    leadQualifier: LeadQualifier.hot,
    tags: ['acme'],
  },
];

interface DemoContact {
  fullName: string;
  company: string;
  title: string;
  emails: string[];
  phones: string[];
  captureMode: CaptureMode;
  leadQualifier: LeadQualifier;
  tags: string[];
}

async function seedPlans() {
  for (const plan of PRODUCT_PLANS) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        name: plan.name,
        priceInr: plan.priceInr,
        billingInterval: plan.billingInterval,
        description: plan.description,
        isActive: true,
      },
    });
  }
}

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
  await seedPlans();
  await seedSuperAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
