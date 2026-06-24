// Home page — public, server component.
// Minimal navigation hub so core routes are reachable without typing URLs.
// Tournament listing / stats are a separate enhancement (Step 3).

import Link from 'next/link';
import { auth } from '@/lib/auth';

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-brand-700">CourtQuest</h1>
        <p className="text-lg text-gray-600">Tournament management for pickleball and beyond.</p>
      </div>

      <nav className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/tournaments"
          className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white hover:bg-brand-700"
        >
          Browse Tournaments
        </Link>

        {session?.user ? (
          <Link
            href="/dashboard"
            className="rounded-md border border-brand-600 px-5 py-2.5 font-medium text-brand-700 hover:bg-brand-50"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-100"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </main>
  );
}
