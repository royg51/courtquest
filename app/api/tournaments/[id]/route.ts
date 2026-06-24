// GET    /api/tournaments/[id]  — get tournament by id
// PUT    /api/tournaments/[id]  — update tournament (organizer owner or ADMIN)
// DELETE /api/tournaments/[id]  — delete tournament (ADMIN only)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  // TODO: call getTournamentById(params.id) from @/lib/tournaments
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export async function PUT(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  // TODO: auth check, ownership check, call updateTournament() from @/lib/tournaments
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export async function DELETE(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  const session = await auth();
  if (!requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  // TODO: call deleteTournament(params.id) from @/lib/tournaments
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
