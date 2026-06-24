// GET /api/tournaments/[id]/bracket
// Returns the full bracket tree for a tournament (public once generated).

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  _ctx: { params: { id: string } }
) {
  // TODO: call getBracketTree(params.id) from @/lib/bracket
  return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
}
