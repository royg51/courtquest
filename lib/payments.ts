// Stripe helpers — Stripe Checkout (hosted page), not Elements/PaymentIntents
// directly. All payment logic is isolated here — API routes call these
// functions, never construct Stripe objects directly.

import Stripe from 'stripe';

// Initialized lazily so missing env var doesn't break non-payment pages.
let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function isStripeLiveMode(): boolean {
  return process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ?? false;
}

// Mixing a test secret key with a live publishable key (or vice versa) is a
// classic deploy-time mistake — Checkout sessions get created in one mode
// while anything relying on the publishable key would expect the other.
// This only ever logs server-side (deploy logs), never anything user-facing.
function warnOnStripeKeyModeMismatch() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) return;

  const secretIsLive = secretKey.startsWith('sk_live_');
  const publishableIsLive = publishableKey.startsWith('pk_live_');
  if (secretIsLive !== publishableIsLive) {
    console.warn(
      `[stripe] STRIPE_SECRET_KEY is ${secretIsLive ? 'live' : 'test'} mode but ` +
        `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is ${publishableIsLive ? 'live' : 'test'} mode — these should match.`
    );
  }
}

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    warnOnStripeKeyModeMismatch();
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export async function createDonationCheckoutSession(
  amountCents: number,
  options?: { isAnonymous?: boolean }
) {
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
    metadata: { type: 'donation', isAnonymous: String(options?.isAnonymous ?? false) },
    // {CHECKOUT_SESSION_ID} is a literal Stripe template token — Stripe
    // substitutes it into the redirect URL itself. The success page uses it
    // to look up the session directly from Stripe for immediate, accurate
    // user-facing confirmation, rather than waiting on the webhook (which is
    // the source of truth for the database, but can land a moment later).
    success_url: `${APP_URL}/donate?status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/donate?status=canceled`,
  });
  return session;
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId);
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
