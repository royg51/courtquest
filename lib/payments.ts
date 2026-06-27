// Stripe helpers — Stripe Checkout (hosted page), not Elements/PaymentIntents
// directly. All payment logic is isolated here — API routes call these
// functions, never construct Stripe objects directly.

import Stripe from 'stripe';

// Initialized lazily so missing env var doesn't break non-payment pages.
let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function createDonationCheckoutSession(amountCents: number) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Donation to CourtQuest' },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { type: 'donation' },
    success_url: `${APP_URL}/donate?status=success`,
    cancel_url: `${APP_URL}/donate?status=canceled`,
  });
  return session;
}

export async function createRegistrationCheckoutSession(
  amountCents: number,
  metadata: { tournamentId: string; teamId: string; tournamentSlug: string }
) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Tournament entry fee' },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { type: 'registration', ...metadata },
    success_url: `${APP_URL}/tournaments/${metadata.tournamentSlug}?payment=success`,
    cancel_url: `${APP_URL}/tournaments/${metadata.tournamentSlug}?payment=canceled`,
  });
  return session;
}

export function constructWebhookEvent(body: string, signature: string) {
  const stripe = getStripe();
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
}
