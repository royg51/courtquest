// PATCH /api/admin/users/[id]/role — ADMIN only.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';
import { updateUserRole } from '@/lib/users';
import { updateUserRoleSchema } from '@/lib/schemas/user';

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

  const user = await updateUserRole(params.id, parsed.data.role);
  return NextResponse.json({ user });
}
