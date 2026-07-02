// Public tournament detail page.

import type { Metadata } from 'next';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getTournamentBySlug } from '@/lib/tournaments';
import { getTeamsForTournament, getUserTeamForTournament } from '@/lib/teams';
import PublicBracketView from '@/components/bracket/PublicBracketView';
import { PayEntryFeeButton } from '@/components/registration/PayEntryFeeButton';
import { pageMetadata } from '@/lib/seo';

// Lazy-loaded with no SSR — same reasoning as the live-donations refresher:
// pulls in @supabase/supabase-js, only needed for the realtime subscription.
const TournamentStatusRefresher = nextDynamic(
  () => import('@/components/realtime/TournamentStatusRefresher').then((m) => m.TournamentStatusRefresher),
  { ssr: false }
);

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [tournament, session] = await Promise.all([
    getTournamentBySlug(params.slug),
    auth(),
  ]);
  if (!tournament) return {};

  // Don't leak title/description for private tournaments to unauthorized visitors.
  if (!tournament.isPublic) {
    const canView =
      session?.user?.id === tournament.organizer.id || session?.user?.role === 'ADMIN';
    if (!canView) return {};
  }

  const description =
    tournament.description ??
    `${tournament.sport} tournament organized by ${tournament.organizer.name} on CourtQuest.`;

  return pageMetadata({
    title: tournament.name,
    description,
    path: `/tournaments/${params.slug}`,
  });
}

export default async function TournamentDetailPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { payment?: string; invite?: string };
}) {
  // Fetch tournament and session in parallel; session is needed for the
  // isPublic gate before any other data is loaded.
  const [tournament, session] = await Promise.all([
    getTournamentBySlug(params.slug),
    auth(),
  ]);

  if (!tournament) {
    notFound();
  }

  // Private tournaments: accessible to the organizer, admins, OR anyone
  // presenting a valid invite code (?invite=CODE from /join/[code]).
  if (!tournament.isPublic) {
    const hasInvite =
      !!searchParams.invite &&
      !!tournament.inviteCode &&
      searchParams.invite.toUpperCase() === tournament.inviteCode;
    const canView =
      hasInvite ||
      session?.user?.id === tournament.organizer.id ||
      session?.user?.role === 'ADMIN';
    if (!canView) {
      notFound();
    }
  }

  const teams = await getTeamsForTournament(tournament.id);
  const confirmedTeams = teams.filter((team) => team.status === 'CONFIRMED');
  const waitlistedCount = teams.filter((team) => team.status === 'WAITLISTED').length;

  const myTeam = session?.user
    ? await getUserTeamForTournament(tournament.id, session.user.id)
    : null;
  // Trust the Stripe redirect for the just-paid case rather than only the
  // DB's paymentStatus — the webhook that flips it to PAID is asynchronous
  // and can land a moment after this redirect, which would otherwise show
  // a "payment received" banner right above a still-visible "Pay Entry Fee"
  // button.
  const justPaid = searchParams.payment === 'success';
  const needsPayment =
    myTeam && tournament.requiresPayment && myTeam.paymentStatus !== 'PAID' && !justPaid;

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
      <TournamentStatusRefresher tournamentId={tournament.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />

      {searchParams.payment === 'success' && (
        <div className="mb-6 flex items-start gap-3 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Payment received — your entry fee is paid and your spot is confirmed.</p>
        </div>
      )}
      {searchParams.payment === 'canceled' && (
        <div className="mb-6 flex items-start gap-3 rounded-md bg-gray-100 px-4 py-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Checkout was canceled — no payment was made. You can try again below.</p>
        </div>
      )}

      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">{tournament.name}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {tournament.sport} · Organized by {tournament.organizer.name}
      </p>

      {tournament.description && (
        <p className="mt-4 text-gray-700 dark:text-gray-300">{tournament.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Status</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">{tournament.status}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Starts</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {new Date(tournament.startDate).toLocaleDateString()}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Participants</dt>
          <dd className="font-medium text-gray-900 dark:text-gray-100">
            {tournament._count.teams}/{tournament.maxParticipants}
          </dd>
        </div>
        {tournament.venue && (
          <div>
            <dt className="text-gray-500 dark:text-gray-400">Venue</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{tournament.venue}</dd>
          </div>
        )}
      </dl>

      {tournament.status === 'OPEN' && !myTeam && (
        <div className="mt-6">
          <Link
            href={`/tournaments/${tournament.slug}/register${searchParams.invite ? `?invite=${encodeURIComponent(searchParams.invite)}` : ''}`}
            className="rounded-md bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            Register
          </Link>
        </div>
      )}

      {needsPayment && myTeam && (
        <div className="mt-6">
          <PayEntryFeeButton
            tournamentId={tournament.id}
            teamId={myTeam.id}
            entryFeeCents={tournament.entryFeeCents}
          />
        </div>
      )}

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Participants
        </h2>
        {confirmedTeams.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No confirmed participants yet.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {confirmedTeams.map((team) => (
              <li
                key={team.id}
                className="rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 dark:border-gray-800 dark:text-gray-100"
              >
                {team.name}
              </li>
            ))}
          </ul>
        )}
        {waitlistedCount > 0 && (
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {waitlistedCount} team(s) waitlisted
          </p>
        )}
      </div>

      {tournament.bracket && (
        <div className="mt-10">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Bracket &amp; Results
          </h2>
          <PublicBracketView
            tournamentId={tournament.id}
            isLive={tournament.status === 'IN_PROGRESS'}
          />
        </div>
      )}
    </main>
  );
}
