// Resolves an invite code to its tournament and redirects to the public
// tournament page (where the register button lives). Shows a friendly message
// for invalid codes instead of a 404.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTournamentByInviteCode } from '@/lib/tournaments';

export const dynamic = 'force-dynamic';

export default async function JoinByCodePage({ params }: { params: { code: string } }) {
  const tournament = await getTournamentByInviteCode(params.code);

  if (tournament) {
    redirect(`/tournaments/${tournament.slug}`);
  }

  return (
    <main className="mx-auto max-w-sm px-4 py-16 text-center">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Code not found</h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        We couldn&apos;t find a tournament for code{' '}
        <span className="font-mono font-semibold">{params.code}</span>. Double-check it with your
        organizer.
      </p>
      <Link
        href="/join"
        className="mt-6 inline-block rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
      >
        Try another code
      </Link>
    </main>
  );
}
