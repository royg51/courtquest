// GET  /api/tournaments  — list public tournaments (filterable)
// POST /api/tournaments  — create tournament (ORGANIZER+ only)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { createTournament, listTournaments } from '@/lib/tournaments';
import { createTournamentSchema } from '@/lib/schemas/tournament';
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? undefined;
  const sport = searchParams.get('sport') ?? undefined;

  const tournaments = await listTournaments({ isPublic: true, status, sport });
  return NextResponse.json({ tournaments });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const { success, reset } = await checkRateLimit(
    'tournamentCreate',
    session.user.id,
    RATE_LIMIT_CONFIG.tournamentCreate
  );
  if (!success) return rateLimitResponse(reset);

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

  const tournament = await createTournament(session.user.id, parsed.data);

  return NextResponse.json({ tournament }, { status: 201 });
}
