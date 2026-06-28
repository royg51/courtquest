// POST /api/webhooks/stripe
// Stripe sends checkout.session.completed (and, as a backup signal,
// payment_intent.succeeded — see below) here once a payment succeeds.
// Must read the raw body (not parsed JSON) for signature verification —
// see lib/payments.ts#constructWebhookEvent.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { Prisma } from '@prisma/client';
import { constructWebhookEvent, isStripeConfigured } from '@/lib/payments';
import { db } from '@/lib/db';

async function markRegistrationPaid(teamId: string, stripePaymentId: string) {
  await db.team.update({
    where: { id: teamId },
    data: { paymentStatus: 'PAID', stripePaymentId },
  });
}

async function recordDonation(input: {
  amountCents: number;
  donorName?: string | null;
  donorEmail?: string | null;
  isAnonymous: boolean;
  stripePaymentId: string;
}) {
  try {
    await db.donation.create({
      data: {
        amountCents: input.amountCents,
        donorName: input.donorName ?? undefined,
        donorEmail: input.donorEmail ?? undefined,
        isAnonymous: input.isAnonymous,
        stripePaymentId: input.stripePaymentId,
      },
    });
  } catch (error) {
    // Stripe redelivers events on timeout or a non-2xx response, and
    // checkout.session.completed + payment_intent.succeeded both fire for
    // the same payment — either path can land first. Both use the same
    // PaymentIntent id as stripePaymentId, so whichever arrives second hits
    // the unique constraint here. Treat that as success, not a failure.
    const alreadyRecorded =
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
    if (!alreadyRecorded) throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet', code: 'STRIPE_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature';
    return NextResponse.json({ error: message, code: 'INVALID_SIGNATURE' }, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const { type, teamId } = session.metadata ?? {};
      const stripePaymentId =
        typeof session.payment_intent === 'string' ? session.payment_intent : session.id;

      if (type === 'registration' && teamId) {
        await markRegistrationPaid(teamId, stripePaymentId);
      } else if (type === 'donation') {
        await recordDonation({
          amountCents: session.amount_total ?? 0,
          donorName: session.customer_details?.name,
          donorEmail: session.customer_details?.email,
          isAnonymous: session.metadata?.isAnonymous === 'true',
          stripePaymentId,
        });
      }
    } else if (event.type === 'payment_intent.succeeded') {
      // Backup signal in case checkout.session.completed is ever missed —
      // for Stripe Checkout's synchronous card flow this is normally
      // redundant with the branch above, and the shared idempotency key
      // (the PaymentIntent id) makes that safe either way. This event's
      // object has no customer_details, so donor name/email are best-effort
      // (receipt_email only, no name) — acceptable for a fallback path.
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { type, teamId } = paymentIntent.metadata ?? {};

      if (type === 'registration' && teamId) {
        await markRegistrationPaid(teamId, paymentIntent.id);
      } else if (type === 'donation') {
        await recordDonation({
          amountCents: paymentIntent.amount,
          donorEmail: paymentIntent.receipt_email,
          isAnonymous: paymentIntent.metadata?.isAnonymous === 'true',
          stripePaymentId: paymentIntent.id,
        });
      }
    }
  } catch (error) {
    // Never let an unexpected shape or a transient DB error crash the
    // handler outright — log it and 500 so Stripe retries, but don't leak
    // internal details in the response. Captured explicitly (not just
    // console.error) since it's caught here and would otherwise never
    // reach Sentry's automatic unhandled-exception instrumentation.
    console.error('[stripe webhook] handler error:', error);
    Sentry.captureException(error, { tags: { route: 'webhooks/stripe', eventType: event.type } });
    return NextResponse.json({ error: 'Internal error', code: 'WEBHOOK_HANDLER_ERROR' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
