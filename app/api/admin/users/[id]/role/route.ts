// PATCH /api/admin/users/[id]/role — ADMIN only.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { updateUserRole, getUserById } from '@/lib/users';
import { updateUserRoleSchema } from '@/lib/schemas/user';
import { recordAudit } from '@/lib/audit';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = updateUserRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  // Capture the prior role before mutating so the audit entry records the
  // actual before -> after transition.
  const previous = await getUserById(params.id);
  if (!previous) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const user = await updateUserRole(params.id, parsed.data.role);

  await recordAudit({
    actor: { id: session!.user.id, email: session!.user.email ?? null },
    action: 'ROLE_CHANGED',
    entityType: 'USER',
    entityId: params.id,
    before: { role: previous.role },
    after: { role: user.role },
    metadata: { targetEmail: previous.email },
  });

  return NextResponse.json({ user });
}
