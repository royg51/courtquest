// POST /api/tournaments/[id]/bracket/generate
// Generates the single-elimination bracket from confirmed teams.
// Requires ORGANIZER role and ownership of the tournament.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { generateSingleEliminationBracket, BracketError, notifyTournamentStarted } from '@/lib/bracket';
import { generateRoundRobinBracket } from '@/lib/formats/round-robin';
import { recordAudit } from '@/lib/audit';
import { isFormatImplemented } from '@/lib/sports';

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

  // Only formats with a working engine can generate. Selectable-but-not-yet
  // built ones (double-elim, Swiss) are rejected explicitly rather than
  // silently producing the wrong bracket.
  if (!isFormatImplemented(tournament.format)) {
    return NextResponse.json(
      {
        error: `Bracket generation for "${tournament.format}" isn't available yet.`,
        code: 'FORMAT_NOT_IMPLEMENTED',
      },
      { status: 422 }
    );
  }

  try {
    const bracket =
      tournament.format === 'ROUND_ROBIN'
        ? await generateRoundRobinBracket(params.id)
        : await generateSingleEliminationBracket(params.id);

    await recordAudit({
      actor: { id: session!.user.id, email: session!.user.email ?? null },
      action: 'BRACKET_GENERATED',
      entityType: 'BRACKET',
      entityId: bracket.id,
      after: { bracketId: bracket.id },
      metadata: { tournamentId: params.id, tournamentSlug: tournament.slug },
    });

    // Tell participants play has started. Non-blocking: a DB/network error
    // in the notification must never 500 the response — the bracket is already
    // committed and the client would incorrectly think generation failed.
    await notifyTournamentStarted(params.id).catch(() => undefined);

    return NextResponse.json({ bracket }, { status: 201 });
  } catch (error) {
    if (error instanceof BracketError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
