// POST /api/tournaments/[id]/bracket/generate
// Generates the single-elimination bracket from confirmed teams.
// Requires ORGANIZER role and ownership of the tournament.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { generateSingleEliminationBracket, BracketError } from '@/lib/bracket';
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
    const bracket = await generateSingleEliminationBracket(params.id);

    await recordAudit({
      actor: { id: session!.user.id, email: session!.user.email ?? null },
      action: 'BRACKET_GENERATED',
      entityType: 'BRACKET',
      entityId: bracket.id,
      after: { bracketId: bracket.id },
      metadata: { tournamentId: params.id, tournamentSlug: tournament.slug },
    });

    return NextResponse.json({ bracket }, { status: 201 });
  } catch (error) {
    if (error instanceof BracketError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
