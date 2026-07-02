import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[72vh] flex-col items-center justify-center px-4 text-center">
      {/* Large muted number */}
      <p
        className="select-none text-[8rem] font-black leading-none text-brand-600/15 dark:text-brand-400/15"
        aria-hidden="true"
      >
        404
      </p>

      <h1 className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Page not found
      </h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        This page doesn&apos;t exist or has been moved. Let&apos;s get you back on the court.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-700 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Search className="h-4 w-4" />
          Browse Events
        </Link>
      </div>
    </main>
  );
}
