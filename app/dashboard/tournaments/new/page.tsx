// Tournament creation form.
// Server-enforced: ORGANIZER (or ADMIN) only. Unauthenticated users are sent
// to /login; authenticated non-organizers are sent back to /dashboard.

import { redirect } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import TournamentForm from '@/components/tournament/TournamentForm';

export default async function NewTournamentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/tournaments/new');
  }

  if (!requireRole(session, 'ORGANIZER')) {
    redirect('/dashboard');
  }

  return (
    <main>
      <h1 className="mx-auto max-w-lg px-4 pt-8 text-2xl font-bold text-brand-700 dark:text-brand-400">
        Create a Tournament
      </h1>
      <TournamentForm mode="create" />
    </main>
  );
}
