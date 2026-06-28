// Next.js instrumentation hook — runs once per server/edge runtime
// startup. This is where the current @sentry/nextjs SDK wants
// Sentry.init() called server-side (sentry.server.config.ts /
// sentry.edge.config.ts are deprecated as of the installed version).
// No-ops entirely if no DSN is configured.
import * as Sentry from '@sentry/nextjs';
import { isExpectedNextError } from '@/lib/sentry-filters';

function dsn() {
  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' || process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn: dsn(),
      enabled: !!dsn(),
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        if (isExpectedNextError(hint.originalException)) return null;
        return event;
      },
    });
  }
}

// Captures errors from nested React Server Components / route handlers
// that the register()-time init alone doesn't see.
export const onRequestError = Sentry.captureRequestError;
