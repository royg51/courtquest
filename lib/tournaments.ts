// Tournament service layer.
// All tournament database access goes through these functions.
// API routes import from here — no Prisma calls in route handlers.
//
// Implemented incrementally:
//   Step 3 — listTournaments, getTournament
//   Step 4 — createTournament, updateTournament, deleteTournament

import { cache } from 'react';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { teamSizeForEntryType } from '@/lib/sports';
import type { CreateTournamentInput, UpdateTournamentInput } from '@/lib/schemas/tournament';

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

// Short, human-typable join code. Excludes visually ambiguous characters
// (0/O, 1/I/L) so codes read aloud or copied from a flyer don't get mangled.
const INVITE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomInviteCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += INVITE_ALPHABET[Math.floor(Math.random() * INVITE_ALPHABET.length)];
  }
  return code;
}

// Generates (or regenerates) a unique invite code for a tournament. Retries
// on the rare collision against the unique index.
export async function generateInviteCode(tournamentId: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomInviteCode();
    const clash = await db.tournament.findUnique({ where: { inviteCode: code }, select: { id: true } });
    if (clash) continue;
    await db.tournament.update({ where: { id: tournamentId }, data: { inviteCode: code } });
    return code;
  }
  throw new Error('Could not generate a unique invite code');
}

export const getTournamentByInviteCode = cache(async (code: string) => {
  return db.tournament.findUnique({
    where: { inviteCode: code.toUpperCase() },
    select: { id: true, slug: true, name: true, status: true },
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
  input: CreateTournamentInput
) {
  const slug = await generateUniqueSlug(input.name);
  const entryFeeCents = Math.round((input.entryFeeDollars ?? 0) * 100);

  return db.tournament.create({
    data: {
      organizerId,
      slug,
      name: input.name,
      description: input.description,
      sport: input.sport,
      format: input.format,
      entryType: input.entryType,
      teamSize: teamSizeForEntryType(input.entryType),
      numberOfCourts: input.numberOfCourts,
      maxParticipants: input.maxParticipants,
      startDate: input.startDate,
      endDate: input.endDate,
      registrationDeadline: input.registrationDeadline,
      entryFeeCents,
      requiresPayment: entryFeeCents > 0,
      venue: input.venue,
      address: input.address,
      allowGuestRegistration: input.allowGuestRegistration ?? false,
      swissRounds: input.swissRounds ?? null,
    },
  });
}

// Maps the (already-validated) update input to a Prisma update payload,
// applying the same derived conversions as create: entryFeeDollars → cents
// (+ requiresPayment), entryType → teamSize. Only fields actually present in
// the input are written, so a partial edit leaves everything else untouched.
export async function updateTournament(id: string, input: UpdateTournamentInput) {
  const data: Prisma.TournamentUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.sport !== undefined) data.sport = input.sport;
  if (input.format !== undefined) data.format = input.format;
  if (input.maxParticipants !== undefined) data.maxParticipants = input.maxParticipants;
  if (input.numberOfCourts !== undefined) data.numberOfCourts = input.numberOfCourts;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.endDate !== undefined) data.endDate = input.endDate;
  if (input.registrationDeadline !== undefined) data.registrationDeadline = input.registrationDeadline;
  if (input.venue !== undefined) data.venue = input.venue;
  if (input.address !== undefined) data.address = input.address;
  if (input.allowGuestRegistration !== undefined)
    data.allowGuestRegistration = input.allowGuestRegistration;
  if (input.swissRounds !== undefined) data.swissRounds = input.swissRounds;
  if (input.status !== undefined) data.status = input.status;

  if (input.entryType !== undefined) {
    data.entryType = input.entryType;
    data.teamSize = teamSizeForEntryType(input.entryType);
  }
  if (input.entryFeeDollars !== undefined) {
    const cents = Math.round(input.entryFeeDollars * 100);
    data.entryFeeCents = cents;
    data.requiresPayment = cents > 0;
  }

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
