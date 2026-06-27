// POST /api/webhooks/stripe
// Stripe sends checkout.session.completed here once a payment succeeds.
// Must read the raw body (not parsed JSON) for signature verification —
// see lib/payments.ts#constructWebhookEvent.

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';
import { constructWebhookEvent, isStripeConfigured } from '@/lib/payments';
import { db } from '@/lib/db';

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { type, teamId } = session.metadata ?? {};

    if (type === 'registration' && teamId) {
      await db.team.update({
        where: { id: teamId },
        data: {
          paymentStatus: 'PAID',
          stripePaymentId:
            typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
        },
      });
    } else if (type === 'donation') {
      try {
        await db.donation.create({
          data: {
            amountCents: session.amount_total ?? 0,
            donorName: session.customer_details?.name ?? undefined,
            donorEmail: session.customer_details?.email ?? undefined,
            isAnonymous: session.metadata?.isAnonymous === 'true',
            stripePaymentId:
              typeof session.payment_intent === 'string' ? session.payment_intent : session.id,
          },
        });
      } catch (error) {
        // Stripe redelivers events on timeout or a non-2xx response — this
        // donation was already recorded by an earlier delivery of the same
        // event, not a new payment. Treat as success rather than retrying
        // forever or recording a duplicate.
        const alreadyRecorded =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!alreadyRecorded) throw error;
      }
    }
  }

  return NextResponse.json({ received: true });
}
