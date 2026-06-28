// POST /api/donations/checkout
// Creates a Stripe Checkout session for a one-time donation. No auth
// required — donations are open to anyone.

import { NextRequest, NextResponse } from 'next/server';
import { createDonationCheckoutSession, isStripeConfigured } from '@/lib/payments';
import { donationCheckoutSchema } from '@/lib/schemas/donation';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, reset } = await checkRateLimit('checkout', ip, RATE_LIMIT_CONFIG.checkout);
  if (!success) return rateLimitResponse(reset);

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet', code: 'STRIPE_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = donationCheckoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', code: 'VALIDATION_ERROR', issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const session = await createDonationCheckoutSession(parsed.data.amountCents, {
    isAnonymous: parsed.data.isAnonymous,
  });
  return NextResponse.json({ url: session.url });
}
