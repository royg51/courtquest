// PATCH  /api/tournaments/[id]/teams/[tid]  — update team status (organizer)
// DELETE /api/tournaments/[id]/teams/[tid]  — withdraw team (member or organizer)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { updateTeamStatus, withdrawTeam, RegistrationError } from '@/lib/teams';
import { updateTeamStatusSchema } from '@/lib/schemas/team';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; tid: string } }
) {
  const session = await auth();
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = session?.user?.id === tournament.organizerId;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  // Verify the team actually belongs to this tournament before mutating.
  // Without this check, an organizer of tournament A who knows a team ID
  // from tournament B could update team B's status.
  const existingTeam = await db.team.findUnique({
    where: { id: params.tid },
    select: { tournamentId: true },
  });
  if (!existingTeam || existingTeam.tournamentId !== params.id) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = updateTeamStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const team = await updateTeamStatus(params.tid, parsed.data.status);
  return NextResponse.json({ team });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; tid: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  // Verify the team belongs to this tournament before allowing withdrawal.
  // withdrawTeam checks membership/organizer via the team's own tournament,
  // but the route should not let callers cross-reference arbitrary team IDs.
  const existingTeam = await db.team.findUnique({
    where: { id: params.tid },
    select: { tournamentId: true },
  });
  if (!existingTeam || existingTeam.tournamentId !== params.id) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  try {
    const team = await withdrawTeam(params.tid, session.user.id);
    return NextResponse.json({ team });
  } catch (error) {
    if (error instanceof RegistrationError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 403;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
