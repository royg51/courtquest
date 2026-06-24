// PUT /api/matches/[id]/score
// Submit scores for a match. Determines winner and advances them in the bracket.
// Requires ORGANIZER role.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';

export async function PUT(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  const session = await auth();
  if (!requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  // TODO: parse { scoreA, scoreB }, validate, call submitScore() from @/lib/matches
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
