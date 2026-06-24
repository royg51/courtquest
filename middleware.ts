// Route protection via Auth.js session.
// Middleware runs on the edge before each request.
//
// Rules (page routes only — see note on /api/* below):
//   /dashboard/*   → any authenticated user, else redirect to /login
//   /organizer/*   → any authenticated user, else redirect to /login
//   /admin/*       → any authenticated user, else redirect to /login
//   /login, /signup → redirect to /dashboard if already authenticated
//
// Role checks beyond "is logged in" (e.g. ORGANIZER vs ADMIN) happen
// inside each page/route via requireRole() from lib/auth.ts.
//
// /api/* routes are intentionally NOT redirected here: API routes already
// call auth()/requireRole() themselves and return JSON 401/403 (see e.g.
// app/api/admin/stats/route.ts). Redirecting them to an HTML /login page
// would break JSON-consuming clients, so middleware only matches pages.
//
// NOTE: exporting `auth` directly as `middleware` (the old version of this
// file) only attaches `req.auth` — it does NOT redirect on its own. The
// callback form below is required to actually enforce anything.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const PROTECTED_PREFIXES = ['/dashboard', '/organizer', '/admin'];
const AUTH_PAGES = ['/login', '/signup'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (isLoggedIn && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isLoggedIn && isProtected) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/dashboard/:path*', '/organizer/:path*', '/admin/:path*', '/login', '/signup'],
};
