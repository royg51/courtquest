// Edit tournament details — owner organizer or ADMIN only. Lets them change
// any field after creation (name, sport, format, dates, courts, fees, etc.),
// per the requirement that these stay editable later. Status transitions
// (open/close registration) live on the manage page, not here.

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import TournamentForm, { type TournamentFormDefaults } from '@/components/tournament/TournamentForm';

function toDateInputValue(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

export default async function EditTournamentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/organizer/tournaments/${params.id}/edit`);
  }

  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    notFound();
  }

  const isOwner = tournament.organizerId === session.user.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    redirect('/organizer');
  }

  const defaults: Partial<TournamentFormDefaults> = {
    name: tournament.name,
    description: tournament.description ?? '',
    sport: tournament.sport,
    format: tournament.format,
    entryType: tournament.entryType,
    maxParticipants: tournament.maxParticipants,
    numberOfCourts: tournament.numberOfCourts,
    entryFeeDollars: tournament.entryFeeCents / 100,
    startDate: toDateInputValue(tournament.startDate),
    endDate: toDateInputValue(tournament.endDate),
    registrationDeadline: toDateInputValue(tournament.registrationDeadline),
    venue: tournament.venue ?? '',
    address: tournament.address ?? '',
  };

  return (
    <main>
      <div className="mx-auto max-w-lg px-4 pt-8">
        <Link
          href={`/organizer/tournaments/${params.id}`}
          className="text-sm text-brand-700 hover:underline dark:text-brand-400"
        >
          ← Back to tournament
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-brand-700 dark:text-brand-400">
          Edit tournament
        </h1>
      </div>
      <TournamentForm mode="edit" tournamentId={params.id} defaults={defaults} />
    </main>
  );
}
