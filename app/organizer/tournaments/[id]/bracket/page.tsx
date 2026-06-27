// Organizer bracket management page. Generate happens from the tournament
// overview page; this page is for viewing + entering scores.

import { redirect, notFound } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import OrganizerBracketView from '@/components/bracket/OrganizerBracketView';

export default async function OrganizerBracketPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/organizer/tournaments/${params.id}/bracket`);
  }

  const tournament = await getTournamentById(params.id);
  if (!tournament) {
    notFound();
  }

  const isOwner = tournament.organizerId === session.user.id;
  if (!isOwner && !requireRole(session, 'ADMIN')) {
    redirect('/organizer');
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700 dark:text-brand-400">{tournament.name} — Bracket</h1>
      <OrganizerBracketView tournamentId={tournament.id} />
    </main>
  );
}
