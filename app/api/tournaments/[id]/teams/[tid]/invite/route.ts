// POST /api/tournaments/[id]/teams/[tid]/invite — invite (or re-invite) a
// partner by email. Requires being a member of the team or the organizer.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { inviteTeamMemberByEmail, InviteError } from '@/lib/invites';
import { inviteMemberSchema } from '@/lib/schemas/team';
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; tid: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { success, reset } = await checkRateLimit('inviteSend', session.user.id, RATE_LIMIT_CONFIG.inviteSend);
  if (!success) return rateLimitResponse(reset);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = inviteMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  try {
    const member = await inviteTeamMemberByEmail(params.tid, session.user.id, parsed.data.email);
    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    if (error instanceof InviteError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 409;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    throw error;
  }
}
