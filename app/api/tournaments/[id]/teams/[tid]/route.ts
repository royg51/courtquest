// PATCH  /api/tournaments/[id]/teams/[tid]  — update team status (organizer)
// DELETE /api/tournaments/[id]/teams/[tid]  — withdraw team (member or organizer)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function PATCH(
  _request: NextRequest,
  _ctx: { params: { id: string; tid: string } }
) {
  // TODO: auth + ownership check, call updateTeamStatus() from @/lib/teams
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}

export async function DELETE(
  _request: NextRequest,
  _ctx: { params: { id: string; tid: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  // TODO: call withdrawTeam(params.tid, session.user.id) from @/lib/teams
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
