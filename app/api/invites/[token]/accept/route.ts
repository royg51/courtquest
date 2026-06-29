// POST /api/invites/[token]/accept — requires login. Anyone holding the
// (unguessable) token link can accept once authenticated, the same trust
// model most app invite links use.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { acceptInvite, InviteError } from '@/lib/invites';

export async function POST(_request: NextRequest, { params }: { params: { token: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Sign in to accept this invite', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const member = await acceptInvite(params.token, session.user.id);
    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof InviteError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
