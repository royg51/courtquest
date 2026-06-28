// POST /api/tournaments/[id]/teams/[tid]/checkout
// Creates a Stripe Checkout session for a team's tournament entry fee.
// Requires the requesting user to be a member of that team.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { createRegistrationCheckoutSession, isStripeConfigured } from '@/lib/payments';
import { checkRateLimit, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string; tid: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { success, reset } = await checkRateLimit(
    'checkout',
    session.user.id,
    RATE_LIMIT_CONFIG.checkout
  );
  if (!success) return rateLimitResponse(reset);

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet', code: 'STRIPE_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  const team = await db.team.findUnique({
    where: { id: params.tid },
    include: { members: true, tournament: true },
  });
  if (!team || team.tournamentId !== params.id) {
    return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  }

  const isMember = team.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }

  if (!team.tournament.requiresPayment || team.tournament.entryFeeCents <= 0) {
    return NextResponse.json(
      { error: 'This tournament does not require payment', code: 'NO_PAYMENT_REQUIRED' },
      { status: 400 }
    );
  }
  if (team.paymentStatus === 'PAID') {
    return NextResponse.json(
      { error: 'Entry fee already paid', code: 'ALREADY_PAID' },
      { status: 409 }
    );
  }

  const checkoutSession = await createRegistrationCheckoutSession(
    team.tournament.entryFeeCents,
    {
      tournamentId: team.tournamentId,
      teamId: team.id,
      tournamentSlug: team.tournament.slug,
    }
  );
  return NextResponse.json({ url: checkoutSession.url });
}
