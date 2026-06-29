// POST /api/invites/[token]/decline — no login required; declining isn't a
// privileged action and forcing a signup just to say "no" would be friction
// for no real benefit.

import { NextRequest, NextResponse } from 'next/server';
import { declineInvite, InviteError } from '@/lib/invites';

export async function POST(_request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const member = await declineInvite(params.token);
    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof InviteError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
