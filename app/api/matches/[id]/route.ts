// PATCH /api/matches/[id]
// Set/clear a match's court number and scheduled time.
// Requires ORGANIZER ownership of the tournament the match belongs to (or ADMIN).

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { updateMatchSchedule, MatchError } from '@/lib/matches';
import { updateMatchScheduleSchema } from '@/lib/schemas/match';
import { recordAudit } from '@/lib/audit';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const match = await db.match.findUnique({
    where: { id: params.id },
    include: { round: { include: { bracket: { include: { tournament: true } } } } },
  });
  if (!match) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = match.round.bracket.tournament.organizerId === session?.user?.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = updateMatchScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  try {
    const updated = await updateMatchSchedule(params.id, parsed.data);

    await recordAudit({
      actor: { id: session!.user.id, email: session!.user.email ?? null },
      action: 'MATCH_SCHEDULED',
      entityType: 'MATCH',
      entityId: params.id,
      before: { courtNumber: match.courtNumber, scheduledAt: match.scheduledAt },
      after: { courtNumber: updated.courtNumber, scheduledAt: updated.scheduledAt },
      metadata: { tournamentId: match.round.bracket.tournament.id },
    });

    return NextResponse.json({ match: updated });
  } catch (error) {
    if (error instanceof MatchError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
