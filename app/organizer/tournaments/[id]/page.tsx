// Organizer tournament overview page.
// Shows registration count, status, shareable link, quick links to sub-pages.

import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import { CopyLinkButton } from '@/components/organizer/CopyLinkButton';
import { GenerateBracketButton } from '@/components/organizer/GenerateBracketButton';
import { UpdateStatusButton } from '@/components/organizer/UpdateStatusButton';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default async function OrganizerTournamentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/organizer/tournaments/${params.id}`);
  }

  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    notFound();
  }

  const isOwner = tournament.organizerId === session.user.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    redirect('/organizer');
  }

  const publicUrl = `${APP_URL}/tournaments/${tournament.slug}`;

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">{tournament.name}</h1>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          {tournament.status}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <p className="truncate text-sm text-gray-500 dark:text-gray-400">{publicUrl}</p>
        <CopyLinkButton url={publicUrl} />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Registered</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {tournament._count.teams}/{tournament.maxParticipants}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Starts</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(tournament.startDate).toLocaleDateString()}
          </dd>
        </div>
      </dl>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {tournament.status === 'DRAFT' && (
          <UpdateStatusButton
            tournamentId={tournament.id}
            status="OPEN"
            label="Open Registration"
          />
        )}
        {tournament.status === 'OPEN' && (
          <UpdateStatusButton
            tournamentId={tournament.id}
            status="DRAFT"
            label="Close Registration"
          />
        )}

        <Link
          href={`/organizer/tournaments/${tournament.id}/registrations`}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Manage Registrations
        </Link>

        {tournament.bracket ? (
          <Link
            href={`/organizer/tournaments/${tournament.id}/bracket`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Manage Bracket
          </Link>
        ) : (
          <GenerateBracketButton tournamentId={tournament.id} />
        )}
      </div>
    </main>
  );
}
