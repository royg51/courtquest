// POST /api/tournaments/[id]/schedule/auto
// Auto-assigns playable matches across the tournament's available courts.
// Requires ORGANIZER ownership of the tournament (or ADMIN).

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { autoAssignCourts, MatchError } from '@/lib/matches';
import { recordAudit } from '@/lib/audit';

export async function POST(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = tournament.organizerId === session?.user?.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const assigned = await autoAssignCourts(params.id);

    await recordAudit({
      actor: { id: session!.user.id, email: session!.user.email ?? null },
      action: 'COURTS_AUTO_ASSIGNED',
      entityType: 'TOURNAMENT',
      entityId: params.id,
      after: { matchesAssigned: assigned, courts: tournament.numberOfCourts },
      metadata: { tournamentSlug: tournament.slug },
    });

    return NextResponse.json({ assigned });
  } catch (error) {
    if (error instanceof MatchError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
