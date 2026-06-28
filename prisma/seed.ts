// One-time, safely re-runnable admin bootstrap.
// Only ever UPDATEs an existing User's role — never creates accounts or
// invents credentials. If someone hasn't signed up yet, this just logs
// that and skips them; re-run this script after they sign up.
//
// Admin emails come from ADMIN_EMAILS (comma-separated) in .env, not
// hardcoded here — this file is committed to git, and real people's
// personal email addresses shouldn't end up baked into source history in
// a public repo. Set ADMIN_EMAILS in courtquest/.env before running this.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

async function main() {
  if (ADMIN_EMAILS.length === 0) {
    console.log('[seed] ADMIN_EMAILS is not set in .env — nothing to do.');
    return;
  }

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
