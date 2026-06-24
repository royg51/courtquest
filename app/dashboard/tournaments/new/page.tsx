// Tournament creation form.
// Server-enforced: ORGANIZER (or ADMIN) only. Unauthenticated users are sent
// to /login; authenticated non-organizers are sent back to /dashboard.

import { redirect } from 'next/navigation';
import { auth, requireRole } from '@/lib/auth';
import CreateTournamentForm from '@/components/tournament/CreateTournamentForm';

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
      <h1 className="mx-auto max-w-md px-4 pt-8 text-2xl font-bold text-brand-700">
        Create a Tournament
      </h1>
      <CreateTournamentForm />
    </main>
  );
}
