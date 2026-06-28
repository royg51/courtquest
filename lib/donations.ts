// Read-only queries for the public donor-recognition section on /donate.
// Donations are a standalone revenue stream, not tied to tournaments —
// per-tournament revenue comes from entry fees instead (see lib/tournaments.ts).

import { db } from '@/lib/db';

export async function getRecentDonations(take = 8) {
  return db.donation.findMany({
    where: { isAnonymous: false },
    orderBy: { createdAt: 'desc' },
    take,
    select: { id: true, donorName: true, amountCents: true, message: true, createdAt: true },
  });
}

export async function getTopDonors(take = 5) {
  const grouped = await db.donation.groupBy({
    by: ['donorName'],
    where: { isAnonymous: false, donorName: { not: null } },
    _sum: { amountCents: true },
    orderBy: { _sum: { amountCents: 'desc' } },
    take,
  });

  return grouped.map((g) => ({
    donorName: g.donorName as string,
    totalCents: g._sum.amountCents ?? 0,
  }));
}

export async function getTotalDonatedCents() {
  const result = await db.donation.aggregate({ _sum: { amountCents: true } });
  return result._sum.amountCents ?? 0;
}

// Admin-only — unlike getRecentDonations/getTopDonors, this includes
// anonymous donations and donor email. "Anonymous" means hidden from the
// public donor lists, not hidden from the org's own records (Stripe already
// has the payer's identity regardless; admins need it for bookkeeping).
export async function getAllDonationsForAdmin(take = 100) {
  return db.donation.findMany({
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      donorName: true,
      donorEmail: true,
      amountCents: true,
      isAnonymous: true,
      message: true,
      stripePaymentId: true,
      createdAt: true,
    },
  });
}

export async function getDonationStats() {
  const [totalCents, count] = await Promise.all([
    getTotalDonatedCents(),
    db.donation.count(),
  ]);
  return { totalCents, count };
}
