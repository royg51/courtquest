// GET  /api/tournaments  — list public tournaments (filterable)
// POST /api/tournaments  — create tournament (ORGANIZER+ only)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { createTournament, listTournaments } from '@/lib/tournaments';
import { createTournamentSchema } from '@/lib/schemas/tournament';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const sport = searchParams.get('sport') ?? undefined;

  const tournaments = await listTournaments({ isPublic: true, status, sport });
  return NextResponse.json({ tournaments });
}

// MVP shortcut: the creation form only collects name/description/sport/maxParticipants.
// Dates aren't user-editable yet, so we default them to a sensible 2-week-out
// window here; PUT /api/tournaments/[id] is the place to let organizers change them.
const DAY_MS = 24 * 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = createTournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const now = Date.now();
  const startDate = new Date(now + 14 * DAY_MS);
  const endDate = new Date(now + 15 * DAY_MS);
  const registrationDeadline = new Date(now + 7 * DAY_MS);

  const tournament = await createTournament(session.user.id, {
    name: parsed.data.name,
    description: parsed.data.description,
    sport: parsed.data.sport,
    format: 'SINGLE_ELIM',
    teamSize: 1,
    startDate,
    endDate,
    registrationDeadline,
    maxParticipants: parsed.data.maxParticipants,
  });

  return NextResponse.json({ tournament }, { status: 201 });
}
