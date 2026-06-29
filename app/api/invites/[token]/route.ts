// GET /api/invites/[token] — public invite details for the accept/decline
// landing page. No auth required to view; accepting/declining does.

import { NextRequest, NextResponse } from 'next/server';
import { getInviteByToken } from '@/lib/invites';

export async function GET(_request: NextRequest, { params }: { params: { token: string } }) {
  const invite = await getInviteByToken(params.token);
  if (!invite) {
    return NextResponse.json({ error: 'Invite not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ invite });
}
