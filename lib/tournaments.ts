// Tournament service layer.
// All tournament database access goes through these functions.
// API routes import from here — no Prisma calls in route handlers.
//
// Implemented incrementally:
//   Step 3 — listTournaments, getTournament
//   Step 4 — createTournament, updateTournament, deleteTournament

import { db as _db } from '@/lib/db';

export async function listTournaments(_filters?: {
  status?: string;
  sport?: string;
  isPublic?: boolean;
}) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function getTournamentBySlug(_slug: string) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function getTournamentById(_id: string) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function createTournament(
  _organizerId: string,
  _data: {
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
  // TODO: implement (generates slug from name + year)
  throw new Error('Not implemented');
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
