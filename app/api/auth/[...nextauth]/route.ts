// Auth.js catch-all route handler.
// Handles: GET/POST /api/auth/signin, /api/auth/signout, /api/auth/session,
//          /api/auth/callback/[provider], etc.
//
// POST covers credential sign-in attempts (and CSRF/session calls), so it's
// rate-limited by IP to slow down brute-forcing — GET is read-only session
// checks, left unlimited.

import type { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth';
import { checkRateLimit, getClientIp, rateLimitResponse, RATE_LIMIT_CONFIG } from '@/lib/rate-limit';

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, reset } = await checkRateLimit('login', ip, RATE_LIMIT_CONFIG.login);
  if (!success) return rateLimitResponse(reset);

  return handlers.POST(request);
}
