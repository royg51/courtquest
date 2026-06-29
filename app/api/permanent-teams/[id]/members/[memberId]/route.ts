// DELETE /api/permanent-teams/[id]/members/[memberId] — remove a member.
// Requires being a member of the team; the primary member can't be removed.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { removePermanentTeamMember, PermanentTeamError } from '@/lib/permanentTeams';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    await removePermanentTeamMember(params.id, params.memberId, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PermanentTeamError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
