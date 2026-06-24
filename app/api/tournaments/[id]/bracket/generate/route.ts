// POST /api/tournaments/[id]/bracket/generate
// Generates the single-elimination bracket from confirmed teams.
// Requires ORGANIZER role and ownership of the tournament.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';

export async function POST(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  const session = await auth();
  if (!requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  // TODO: verify organizer owns this tournament, then call generateSingleEliminationBracket() from @/lib/bracket
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
