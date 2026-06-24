import NextAuth, { type Session } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import type { Role } from '@/types';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  pages: {
    signIn: '/login',
  },
  providers: [
    Google,
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== 'string' || typeof password !== 'string') return null;

        const user = await db.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, role: true, passwordHash: true },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as Role,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        // user is present only on first sign-in; persist role into the token
        token.role = (user.role as Role | undefined) ?? 'PLAYER';
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.sub!;
      session.user.role = (token.role ?? 'PLAYER') as Role;
      return session;
    },
  },
});

// Role guard — use in API routes and Server Components.
// ORGANIZER access also grants ADMIN-level callers through (ADMIN ⊇ ORGANIZER).
export function requireRole(
  session: Session | null,
  role: 'ORGANIZER' | 'ADMIN'
): boolean {
  const userRole = session?.user?.role;
  if (!userRole) return false;
  if (role === 'ADMIN') return userRole === 'ADMIN';
  return userRole === 'ORGANIZER' || userRole === 'ADMIN';
}
