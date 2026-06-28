// Next.js client instrumentation hook (replaces the deprecated
// sentry.client.config.ts in current @sentry/nextjs versions — required
// for Turbopack compatibility going forward). No-ops entirely if
// NEXT_PUBLIC_SENTRY_DSN isn't set; local dev needs nothing extra.
import * as Sentry from '@sentry/nextjs';
import { isExpectedNextError } from '@/lib/sentry-filters';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend(event, hint) {
    if (isExpectedNextError(hint.originalException)) return null;
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
