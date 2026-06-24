// Public tournament detail page.
// Shows info now; registration button and bracket viewer come in later steps.

import { notFound } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/tournaments';

export default async function TournamentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = await getTournamentBySlug(params.slug);

  if (!tournament) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700">{tournament.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {tournament.sport} · Organized by {tournament.organizer.name}
      </p>

      {tournament.description && <p className="mt-4 text-gray-700">{tournament.description}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Status</dt>
          <dd className="font-medium text-gray-900">{tournament.status}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Starts</dt>
          <dd className="font-medium text-gray-900">
            {new Date(tournament.startDate).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Participants</dt>
          <dd className="font-medium text-gray-900">
            {tournament._count.teams}/{tournament.maxParticipants}
          </dd>
        </div>
        {tournament.venue && (
          <div>
            <dt className="text-gray-500">Venue</dt>
            <dd className="font-medium text-gray-900">{tournament.venue}</dd>
          </div>
        )}
      </dl>
    </main>
  );
}
