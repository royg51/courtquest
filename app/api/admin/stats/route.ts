// GET /api/admin/stats
// Returns platform-wide stats: total users, tournaments, registrations, donations.
// ADMIN only.

import { NextRequest, NextResponse } from 'next/server';
import { auth, requireRole } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!requireRole(session, 'ADMIN')) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  // TODO: aggregate counts from db
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
