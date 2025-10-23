// Seed script to create the first user from environment variables
// Run via: npx prisma db seed

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.FIRST_USER_EMAIL;
  const password = process.env.FIRST_USER_PASSWORD;
  const title = process.env.FIRST_USER_TITLE || null;
  const firstName = process.env.FIRST_USER_FIRST_NAME || null;
  const lastName = process.env.FIRST_USER_LAST_NAME || null;
  const roleEnv = (process.env.FIRST_USER_ROLE || 'SUPER_ADMIN').toUpperCase();

  const allowedRoles = ['TEACHER', 'ADMIN', 'SUPER_ADMIN'];
  const role = allowedRoles.includes(roleEnv) ? roleEnv : 'SUPER_ADMIN';

  if (!email || !password) {
    console.warn('[seed] Skipping: FIRST_USER_EMAIL or FIRST_USER_PASSWORD not set in .env');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user
    .upsert({
      where: { email },
      update: {}, // do not overwrite existing user if already created
      create: {
        email,
        passwordHash,
        title,
        firstName,
        lastName,
        role,
      },
    })
    .then(() => {
      console.log(`[seed] First user ensured: ${email} (role: ${role})`);
    });
}

main()
  .catch((e) => {
    console.error('[seed] Error:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
