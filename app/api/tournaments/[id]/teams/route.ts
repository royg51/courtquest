// GET  /api/tournaments/[id]/teams  — list registrations (organizer/admin)
// POST /api/tournaments/[id]/teams  — register a team (any authenticated user)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { getTeamsForTournament, registerTeam, RegistrationError } from '@/lib/teams';
import { registerTeamSchema } from '@/lib/schemas/team';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = session?.user?.id === tournament.organizerId;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const teams = await getTeamsForTournament(params.id);
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = registerTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  try {
    const team = await registerTeam(params.id, {
      primaryUserId: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    if (error instanceof RegistrationError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
