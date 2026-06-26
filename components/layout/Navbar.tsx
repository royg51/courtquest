// Top navigation bar.
// Auth-aware: shows Dashboard + Logout when signed in, Login + Sign Up otherwise.

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { status } = useSession();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-full" />
          CourtQuest
        </Link>

        <div className="flex items-center gap-3 text-sm font-medium text-gray-700 sm:gap-4">
          <Link href="/tournaments" className="hidden hover:text-brand-700 sm:inline">
            Tournaments
          </Link>
          <Link href="/organizer" className="hidden hover:text-brand-700 sm:inline">
            Organizer
          </Link>

          {status === 'authenticated' && (
            <>
              <Link href="/dashboard" className="hover:text-brand-700">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100"
              >
                Logout
              </button>
            </>
          )}

          {status === 'unauthenticated' && (
            <>
              <Link href="/login" className="hover:text-brand-700">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
