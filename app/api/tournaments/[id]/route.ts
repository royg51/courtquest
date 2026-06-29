// GET    /api/tournaments/[id]  — get tournament by id
// PUT    /api/tournaments/[id]  — update tournament (organizer owner or ADMIN)
// DELETE /api/tournaments/[id]  — delete tournament (ADMIN only)

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById, updateTournament, deleteTournament } from '@/lib/tournaments';
import { updateTournamentSchema } from '@/lib/schemas/tournament';
import { recordAudit, diffChangedFields } from '@/lib/audit';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ tournament });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const existing = await getTournamentById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isOwner = existing.organizerId === session.user.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = updateTournamentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const tournament = await updateTournament(params.id, parsed.data);

  const { before, after } = diffChangedFields(
    existing as unknown as Record<string, unknown>,
    parsed.data as Record<string, unknown>
  );
  await recordAudit({
    actor: { id: session.user.id, email: session.user.email ?? null },
    action: 'TOURNAMENT_UPDATED',
    entityType: 'TOURNAMENT',
    entityId: params.id,
    before,
    after,
    metadata: { slug: existing.slug },
  });

  return NextResponse.json({ tournament });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  const existing = await getTournamentById(params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  await deleteTournament(params.id);

  await recordAudit({
    // requireRole(session, 'ADMIN') above returned true, so session is non-null.
    actor: { id: session!.user.id, email: session!.user.email ?? null },
    action: 'TOURNAMENT_DELETED',
    entityType: 'TOURNAMENT',
    entityId: params.id,
    before: { name: existing.name, slug: existing.slug, status: existing.status },
    after: null,
  });

  return NextResponse.json({ success: true });
}
