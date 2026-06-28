// Rate limiting for abuse-prone endpoints (auth, checkout, registration).
//
// Production (Vercel): backed by Upstash Redis — serverless functions are
// stateless across invocations, so an in-memory counter wouldn't actually
// limit anything across requests hitting different instances.
// Local dev: falls back to an in-memory limiter automatically when
// UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN aren't set, so there's
// nothing extra to install/configure to develop locally. The in-memory
// fallback is NOT safe for a multi-instance production deployment — it's
// dev-only by design.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

export interface RateLimitConfig {
  /** Requests allowed per window. */
  limit: number;
  /** Window size in seconds. */
  windowSeconds: number;
}

// Defaults, overridable per-limiter via environment variables (see each
// call site for the exact env var names). These are deliberately generous
// enough not to bother a real user clicking around normally, while still
// capping scripted abuse.
const DEFAULTS = {
  login: { limit: 10, windowSeconds: 60 },
  signup: { limit: 5, windowSeconds: 60 * 60 },
  checkout: { limit: 10, windowSeconds: 60 },
  tournamentCreate: { limit: 10, windowSeconds: 60 * 60 },
  registration: { limit: 20, windowSeconds: 60 * 60 },
} as const;

function envConfig(prefix: string, fallback: RateLimitConfig): RateLimitConfig {
  const limit = Number(process.env[`${prefix}_MAX`]);
  const windowSeconds = Number(process.env[`${prefix}_WINDOW_SECONDS`]);
  return {
    limit: Number.isFinite(limit) && limit > 0 ? limit : fallback.limit,
    windowSeconds:
      Number.isFinite(windowSeconds) && windowSeconds > 0 ? windowSeconds : fallback.windowSeconds,
  };
}

export const RATE_LIMIT_CONFIG = {
  login: envConfig('RATE_LIMIT_LOGIN', DEFAULTS.login),
  signup: envConfig('RATE_LIMIT_SIGNUP', DEFAULTS.signup),
  checkout: envConfig('RATE_LIMIT_CHECKOUT', DEFAULTS.checkout),
  tournamentCreate: envConfig('RATE_LIMIT_TOURNAMENT_CREATE', DEFAULTS.tournamentCreate),
  registration: envConfig('RATE_LIMIT_REGISTRATION', DEFAULTS.registration),
};

function isUpstashConfigured(): boolean {
  return !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
}

const limiters = new Map<string, Ratelimit>();

function getUpstashLimiter(name: string, config: RateLimitConfig): Ratelimit {
  const key = `${name}:${config.limit}:${config.windowSeconds}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.limit, `${config.windowSeconds} s`),
      prefix: `courtquest:ratelimit:${name}`,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// Dev-only in-memory fallback: fixed-window counter per key. Cleared
// opportunistically (no background timer needed — checked lazily on read).
//
// Stashed on globalThis rather than a plain module-level variable for the
// same reason lib/db.ts does this for the Prisma client: Next.js's dev
// server can re-evaluate a route's module graph between requests (on-
// demand entries, fast refresh), which would otherwise silently reset
// this Map and make rate limits look like they're not working.
const globalForRateLimit = globalThis as unknown as {
  rateLimitMemoryStore?: Map<string, { count: number; resetAt: number }>;
};
const memoryStore = globalForRateLimit.rateLimitMemoryStore ?? new Map();
if (process.env.NODE_ENV !== 'production') {
  globalForRateLimit.rateLimitMemoryStore = memoryStore;
}

function checkMemoryLimit(
  name: string,
  identifier: string,
  config: RateLimitConfig
): { success: boolean; remaining: number; reset: number } {
  const key = `${name}:${identifier}`;
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowSeconds * 1000;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.limit - 1, reset: resetAt };
  }

  if (entry.count >= config.limit) {
    return { success: false, remaining: 0, reset: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: config.limit - entry.count, reset: entry.resetAt };
}

export async function checkRateLimit(
  name: string,
  identifier: string,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (isUpstashConfigured()) {
    const limiter = getUpstashLimiter(name, config);
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
  }
  return checkMemoryLimit(name, identifier, config);
}

// Vercel sets x-forwarded-for; falls back to a constant so local dev
// (where this header is absent) still rate-limits per-process rather than
// throwing on a missing identifier.
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

export function rateLimitResponse(reset: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: 'Too many requests', code: 'RATE_LIMITED' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}
