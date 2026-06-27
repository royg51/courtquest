// GET /api/tournaments/[id]/bracket
// Returns the full bracket tree for a tournament (public once generated).

import { NextRequest, NextResponse } from 'next/server';
import { getBracketTree } from '@/lib/bracket';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const bracket = await getBracketTree(params.id);
  if (!bracket) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }
  return NextResponse.json({ bracket });
}
