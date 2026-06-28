// One-time, safely re-runnable admin bootstrap.
// Only ever UPDATEs an existing User's role — never creates accounts or
// invents credentials. If someone hasn't signed up yet, this just logs
// that and skips them; re-run this script after they sign up.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  'royg321123@gmail.com',
  'aimanullah09@gmail.com',
  'raksithrg@gmail.com',
];

async function main() {
  for (const email of ADMIN_EMAILS) {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (!user) {
      console.log(`[seed] ${email} — no account yet, skipping (re-run after they sign up)`);
      continue;
    }
    if (user.role === 'ADMIN') {
      console.log(`[seed] ${email} — already ADMIN, no change`);
      continue;
    }
    await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } });
    console.log(`[seed] ${email} — promoted to ADMIN (was ${user.role})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
