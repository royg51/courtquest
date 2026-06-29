// POST /api/tournaments/[id]/invite-code
// Generate (or regenerate) a shareable join code. Owner organizer or ADMIN.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById, generateInviteCode } from '@/lib/tournaments';
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

  const code = await generateInviteCode(params.id);

  await recordAudit({
    actor: { id: session!.user.id, email: session!.user.email ?? null },
    action: 'TOURNAMENT_UPDATED',
    entityType: 'TOURNAMENT',
    entityId: params.id,
    after: { inviteCode: code },
    metadata: { tournamentSlug: tournament.slug, change: 'invite_code_generated' },
  });

  return NextResponse.json({ inviteCode: code });
}
