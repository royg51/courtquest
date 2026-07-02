// GET /api/tournaments/[id]/bracket
// Returns the full bracket tree for a tournament.
// Public tournaments: no auth required.
// Private tournaments: organizer or ADMIN only (same rule as the detail page).

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { getBracketTree } from '@/lib/bracket';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  if (!tournament.isPublic) {
    const session = await auth();
    const canView =
      session?.user?.id === tournament.organizerId || session?.user?.role === 'ADMIN';
    if (!canView) {
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }
  }

  const bracket = await getBracketTree(params.id);
  if (!bracket) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ bracket });
}
