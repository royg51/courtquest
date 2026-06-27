// Organizer registration management page.
// Lists all teams with status controls: confirm, waitlist, withdraw.

import { redirect, notFound } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import { getTournamentById } from '@/lib/tournaments';
import RegistrationsTable from '@/components/organizer/RegistrationsTable';

export default async function RegistrationsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/organizer/tournaments/${params.id}/registrations`);
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">
        {tournament.name} — Registrations
      </h1>
      <RegistrationsTable tournamentId={tournament.id} />
    </main>
  );
}
