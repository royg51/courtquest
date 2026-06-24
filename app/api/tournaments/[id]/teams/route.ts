// GET  /api/tournaments/[id]/teams  — list registrations (organizer/admin)
// POST /api/tournaments/[id]/teams  — register a team (any authenticated user)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  // TODO: call getTeamsForTournament(params.id) from @/lib/teams
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export async function POST(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  // TODO: parse body, validate with Zod, call registerTeam() from @/lib/teams
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
