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
  status?: string;
  sport?: string;
  isPublic?: boolean;
}) {
  return db.tournament.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.sport ? { sport: filters.sport } : {}),
      ...(filters?.isPublic !== undefined ? { isPublic: filters.isPublic } : {}),
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
    },
  });
});

export async function getTournamentById(_id: string) {
  // TODO: implement
  throw new Error('Not implemented');
}

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
  _id: string,
  _data: Partial<Parameters<typeof createTournament>[1]>
) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function deleteTournament(_id: string) {
  // TODO: implement
  throw new Error('Not implemented');
}
