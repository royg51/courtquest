// Tournament service layer.
// All tournament database access goes through these functions.
// API routes import from here — no Prisma calls in route handlers.
//
// Implemented incrementally:
//   Step 3 — listTournaments, getTournament
//   Step 4 — createTournament, updateTournament, deleteTournament

import { cache } from 'react';
import { db } from '@/lib/db';

export async function listTournaments(filters?: {
  status?: string | string[];
  sport?: string;
  isPublic?: boolean;
  organizerId?: string;
}) {
  const statusFilter = Array.isArray(filters?.status)
    ? { status: { in: filters.status } }
    : filters?.status
      ? { status: filters.status }
      : {};

  return db.tournament.findMany({
    where: {
      ...statusFilter,
      ...(filters?.sport ? { sport: filters.sport } : {}),
      ...(filters?.isPublic !== undefined ? { isPublic: filters.isPublic } : {}),
      ...(filters?.organizerId ? { organizerId: filters.organizerId } : {}),
    },
    orderBy: { startDate: 'asc' },
    include: { _count: { select: { teams: true } } },
  });
}

// Wrapped in React's cache() since both generateMetadata and the page
// component call this for the same request — dedupes the DB query.
export const getTournamentBySlug = cache(async (slug: string) => {
  return db.tournament.findUnique({
    where: { slug },
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { teams: true } },
      bracket: { select: { id: true } },
    },
  });
});

export const getTournamentById = cache(async (id: string) => {
  return db.tournament.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { teams: true } },
      bracket: { select: { id: true } },
    },
  });
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function generateUniqueSlug(name: string): Promise<string> {
  const base = `${slugify(name)}-${new Date().getFullYear()}`;
  let slug = base;
  let suffix = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await db.tournament.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

export async function createTournament(
  organizerId: string,
  data: {
    name: string;
    description?: string;
    sport?: string;
    format: string;
    startDate: Date;
    endDate: Date;
    registrationDeadline: Date;
    maxParticipants: number;
    teamSize: number;
    entryFeeCents?: number;
    requiresPayment?: boolean;
    venue?: string;
    address?: string;
  }
) {
  const slug = await generateUniqueSlug(data.name);

  return db.tournament.create({
    data: {
      organizerId,
      slug,
      name: data.name,
      description: data.description,
      sport: data.sport,
      format: data.format,
      startDate: data.startDate,
      endDate: data.endDate,
      registrationDeadline: data.registrationDeadline,
      maxParticipants: data.maxParticipants,
      teamSize: data.teamSize,
      entryFeeCents: data.entryFeeCents,
      requiresPayment: data.requiresPayment,
      venue: data.venue,
      address: data.address,
    },
  });
}

export async function updateTournament(
  id: string,
  data: Partial<Parameters<typeof createTournament>[1]> & { status?: string }
) {
  return db.tournament.update({ where: { id }, data });
}

export async function deleteTournament(id: string) {
  // A plain tournament.delete() throws P2003 (Match_roundId_fkey) once a
  // bracket has been generated — verified directly. Match is reachable
  // through two cascade paths in the same delete (Round → Match via
  // CASCADE, and Team → Match.teamA/teamB/winner via SET NULL), and
  // Postgres doesn't reliably order those against each other when they
  // both fire from one parent delete. Deleting matches explicitly first
  // removes the second path before the cascade runs.
  return db.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { round: { bracket: { tournamentId: id } } } });
    return tx.tournament.delete({ where: { id } });
  });
}

// Tournament revenue is entry fees only — donations are a separate, global
// revenue stream and are intentionally never read here (see the Donation
// model's tournamentId comment in schema.prisma for why).
export async function getTournamentRevenue(tournamentId: string) {
  const [tournament, totalParticipants, paidParticipants] = await Promise.all([
    db.tournament.findUnique({ where: { id: tournamentId }, select: { entryFeeCents: true } }),
    db.team.count({ where: { tournamentId, status: { not: 'WITHDRAWN' } } }),
    db.team.count({ where: { tournamentId, paymentStatus: 'PAID' } }),
  ]);

  const entryFeeCents = tournament?.entryFeeCents ?? 0;
  return {
    totalEntryFeesCents: paidParticipants * entryFeeCents,
    totalParticipants,
    paidParticipants,
  };
}
