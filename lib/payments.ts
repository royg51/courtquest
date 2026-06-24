// Stripe helpers.
// All payment logic is isolated here — API routes call these functions,
// never construct Stripe objects directly.
//
// Implemented in Step 8 (Payments — stretch MVP)

import Stripe from 'stripe';

// Initialized lazily so missing env var doesn't break non-payment pages
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

export async function createRegistrationPaymentIntent(
  _amountCents: number,
  _metadata: { tournamentId: string; teamId: string }
) {
  // TODO: implement
  throw new Error('Not implemented');
}

export async function createDonationPaymentIntent(_amountCents: number) {
  // TODO: implement
  throw new Error('Not implemented');
}

export function constructWebhookEvent(_body: string, _signature: string) {
  // TODO: implement
  throw new Error('Not implemented');
}
