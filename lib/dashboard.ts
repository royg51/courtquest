// Read-only queries for the player dashboard. Pure aggregation over
// existing Tournament/Team/Match data — no new tournament logic.

import { db } from '@/lib/db';

export async function getOrganizedTournaments(userId: string) {
  return db.tournament.findMany({
    where: { organizerId: userId },
    orderBy: { startDate: 'asc' },
    include: { _count: { select: { teams: true } } },
  });
}

export async function getJoinedTeams(userId: string) {
  return db.team.findMany({
    where: { members: { some: { userId } }, status: { not: 'WITHDRAWN' } },
    include: {
      tournament: { select: { id: true, slug: true, name: true, status: true, startDate: true } },
    },
    orderBy: { registeredAt: 'desc' },
  });
}

export async function getUpcomingMatchesForUser(userId: string) {
  return db.match.findMany({
    where: {
      status: 'PENDING',
      OR: [
        { teamA: { members: { some: { userId } } } },
        { teamB: { members: { some: { userId } } } },
      ],
    },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      round: {
        select: {
          name: true,
          bracket: { select: { tournament: { select: { slug: true, name: true } } } },
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });
}

export async function getRecentResultsForUser(userId: string, take = 5) {
  return db.match.findMany({
    where: {
      status: 'COMPLETED',
      OR: [
        { teamA: { members: { some: { userId } } } },
        { teamB: { members: { some: { userId } } } },
      ],
    },
    include: {
      teamA: { select: { id: true, name: true } },
      teamB: { select: { id: true, name: true } },
      round: {
        select: {
          name: true,
          bracket: { select: { tournament: { select: { slug: true, name: true } } } },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
    take,
  });
}
