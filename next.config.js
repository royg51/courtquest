const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');
const { withSentryConfig } = require('@sentry/nextjs');

// CSP allowances, one line per third party actually wired up (verified via
// grep, not guessed) — keep this list in sync with what the app actually
// loads:
//   - plausible.io: analytics script (components/providers/Analytics.tsx)
//   - *.supabase.co (https + wss): browser realtime client for live donation
//     updates (lib/supabase-client.ts)
//   - *.sentry.io / *.ingest.sentry.io: error event reporting
//   - www.google.com: Google Maps venue embed (components/layout/Footer.tsx)
// 'unsafe-inline' on script-src is required for Next.js's own hydration
// bootstrap script and the JSON-LD blocks in app/layout.tsx — a nonce-based
// strict CSP would remove it but needs per-request middleware wiring and
// careful testing against App Router hydration; out of scope here.
//
// 'unsafe-eval' is added ONLY in dev: Next.js's dev server (Fast Refresh /
// eval-based source maps) calls eval() internally, which this CSP would
// otherwise block — confirmed by reproducing it directly: with 'unsafe-eval'
// missing, the login form's onSubmit handler threw a CSP violation in the
// browser console and silently fell back to a native form GET (credentials
// in the URL). The production build does not use eval and isn't affected —
// verified the same login flow against `next build && next start` with the
// strict policy and it completed normally.
function buildSecurityHeaders(isDev) {
  const csp = [
    `script-src 'self' 'unsafe-inline' https://plausible.io${isDev ? " 'unsafe-eval'" : ''}`,
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://plausible.io https://*.supabase.co wss://*.supabase.co https://*.sentry.io https://*.ingest.sentry.io",
    "frame-src 'self' https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  return [
    { key: 'Content-Security-Policy', value: csp },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  ];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
    ],
  },
};

module.exports = (phase) => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  const withHeaders = {
    ...nextConfig,
    async headers() {
      return [{ source: '/(.*)', headers: buildSecurityHeaders(isDev) }];
    },
  };

  const config =
    phase !== PHASE_DEVELOPMENT_SERVER
      ? withHeaders
      : {
          ...withHeaders,
          // Dev server only: by default Next.js garbage-collects a compiled
          // route's entry after 60s idle, or once more than 5 *other* routes
          // have been visited (pagesBufferLength) — recompiling it fresh, with
          // new internal module ids, on next visit. If a still-open page's
          // already-loaded JS references a shared chunk that got recompiled out
          // from under it, the next chunk-loading call throws "ChunkLoadError:
          // Loading chunk ... failed". This app has more than 5 top-level
          // routes, so normal exploratory navigation (or QA testing across many
          // pages) hits this often. Raising both values doesn't eliminate the
          // underlying race — that's a Next.js dev-server characteristic — but
          // keeps far more routes "hot" at once, making the eviction/recompile
          // race far less likely. Gated to the dev phase only: passing this key
          // during `next build` crashes the build with an unrelated
          // PageNotFoundError for /_document (verified directly). ChunkErrorRecovery
          // (app/layout.tsx) recovers gracefully if the race still happens.
          onDemandEntries: {
            maxInactiveAge: 1000 * 60 * 10,
            pagesBufferLength: 20,
          },
        };

  // Wrapping is safe even without Sentry configured — withSentryConfig only
  // uploads source maps (and only at build time) when SENTRY_AUTH_TOKEN is
  // set; without it, it just skips that step. `silent` suppresses its
  // build-log noise for anyone who hasn't set up Sentry yet.
  return withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: true,
    widenClientFileUpload: true,
  });
};
