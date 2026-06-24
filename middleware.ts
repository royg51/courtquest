// Route protection via Auth.js session.
// Middleware runs on the edge before each request.
//
// Rules:
//   /dashboard/*   → any authenticated user
//   /organizer/*   → ORGANIZER or ADMIN role
//   /admin/*       → ADMIN role only
//   /api/admin/*   → ADMIN role only
//
// Implementation note: role checks that go beyond "is logged in"
// are done inside each API route or page via lib/auth.ts helpers,
// since middleware only has access to the JWT token, not the DB.

export { auth as middleware } from '@/lib/auth';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/organizer/:path*',
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
