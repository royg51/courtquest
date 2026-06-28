const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' },
    ],
  },
};

module.exports = (phase) => {
  if (phase !== PHASE_DEVELOPMENT_SERVER) return nextConfig;

  return {
    ...nextConfig,
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
};
