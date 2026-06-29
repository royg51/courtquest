// POST /api/tournaments/[id]/seed/auto
// Auto-seed confirmed teams by ranking strength. Owner organizer or ADMIN.
// Must run before the bracket is generated.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { autoSeedByRanking, AssistError } from '@/lib/ai-assist';
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
    const seeded = await autoSeedByRanking(params.id);

    await recordAudit({
      actor: { id: session!.user.id, email: session!.user.email ?? null },
      action: 'TEAMS_AUTO_SEEDED',
      entityType: 'TOURNAMENT',
      entityId: params.id,
      after: { teamsSeeded: seeded },
      metadata: { tournamentSlug: tournament.slug, method: 'ranking' },
    });

    return NextResponse.json({ seeded });
  } catch (error) {
    if (error instanceof AssistError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 422;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
