// GET  /api/tournaments  — list public tournaments (filterable)
// POST /api/tournaments  — create tournament (ORGANIZER+ only)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  // TODO: parse query params, call listTournaments() from @/lib/tournaments
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export async function POST(_request: NextRequest) {
  const session = await auth();
  if (!requireRole(session, 'ORGANIZER')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  // TODO: parse body, validate with Zod, call createTournament() from @/lib/tournaments
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
