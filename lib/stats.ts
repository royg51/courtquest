// Lightweight platform analytics for the admin dashboard.

import { db } from '@/lib/db';

export async function getPlatformStats() {
  const [totalUsers, tournamentsCreated, activeTournaments, participantsJoined, totalDonations] =
    await Promise.all([
      db.user.count(),
      db.tournament.count(),
      db.tournament.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      db.teamMember.count(),
      db.donation.count(),
    ]);

  return { totalUsers, tournamentsCreated, activeTournaments, participantsJoined, totalDonations };
}
