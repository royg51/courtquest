// Public tournament detail page.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/tournaments';
import { getTeamsForTournament } from '@/lib/teams';
import PublicBracketView from '@/components/bracket/PublicBracketView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) return {};

  const title = tournament.name;
  const description =
    tournament.description ??
    `${tournament.sport} tournament organized by ${tournament.organizer.name} on CourtQuest.`;

  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description },
  };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const tournament = await getTournamentBySlug(params.slug);

  if (!tournament) {
    notFound();
  }

  const teams = await getTeamsForTournament(tournament.id);
  const confirmedTeams = teams.filter((team) => team.status === 'CONFIRMED');
  const waitlistedCount = teams.filter((team) => team.status === 'WAITLISTED').length;

  const eventJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: tournament.name,
    description: tournament.description ?? undefined,
    sport: tournament.sport,
    startDate: tournament.startDate.toISOString(),
    endDate: tournament.endDate.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: tournament.venue
      ? { '@type': 'Place', name: tournament.venue, address: tournament.address ?? undefined }
      : undefined,
    organizer: { '@type': 'Person', name: tournament.organizer.name },
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

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

      {tournament.status === 'OPEN' && (
        <div className="mt-6">
          <Link
            href={`/tournaments/${tournament.slug}/register`}
            className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Register
          </Link>
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Participants</h2>
        {confirmedTeams.length === 0 ? (
          <p className="text-sm text-gray-500">No confirmed participants yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {confirmedTeams.map((team) => (
              <li
                key={team.id}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900"
              >
                {team.name}
              </li>
            ))}
          </ul>
        )}
        {waitlistedCount > 0 && (
          <p className="mt-2 text-sm text-gray-500">{waitlistedCount} team(s) waitlisted</p>
        )}
      </div>

      {tournament.bracket && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">Bracket &amp; Results</h2>
          <PublicBracketView
            tournamentId={tournament.id}
            isLive={tournament.status === 'IN_PROGRESS'}
          />
        </div>
      )}
    </main>
  );
}
