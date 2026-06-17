const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUsers() {
  const users = await prisma.user.findMany({
    where: { organizationId: null, role: 'user' },
  });

  for (const user of users) {
    const orgName = `${user.fullName || 'User'}'s Vault`;
    const orgSlug = `vault-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const org = await prisma.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        plan: 'free',
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: org.id },
    });
    console.log(`Fixed user ${user.email} (assigned org ${org.id})`);
  }
}

fixUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
