// GET  /api/permanent-teams — list the current user's permanent teams
// POST /api/permanent-teams — create one (creator becomes the primary member)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPermanentTeam, getMyPermanentTeams } from '@/lib/permanentTeams';
import { createPermanentTeamSchema } from '@/lib/schemas/team';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const teams = await getMyPermanentTeams(session.user.id);
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = createPermanentTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const team = await createPermanentTeam(session.user.id, parsed.data.name, parsed.data.sport);
  return NextResponse.json({ team }, { status: 201 });
}
