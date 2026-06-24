// Auth.js catch-all route handler.
// Handles: GET/POST /api/auth/signin, /api/auth/signout, /api/auth/session,
//          /api/auth/callback/[provider], etc.

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
