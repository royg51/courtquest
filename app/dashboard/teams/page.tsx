// My Teams — permanent rosters the player belongs to. Create new ones,
// invite teammates, and see pending invites here; using a team to register
// for a tournament happens on that tournament's registration page.

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getMyPermanentTeams } from '@/lib/permanentTeams';
import MyTeamsPanel from '@/components/team/MyTeamsPanel';

export const metadata: Metadata = { title: 'My Teams' };
export const dynamic = 'force-dynamic';

export default async function MyTeamsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login?callbackUrl=/dashboard/teams');
  }

  const teams = (await getMyPermanentTeams(session.user.id)).map((t) => ({
    id: t.id,
    name: t.name,
    sport: t.sport,
    members: t.members.map((m) => ({
      id: m.id,
      name: m.user?.name ?? m.guestEmail ?? 'Pending invite',
      isPrimary: m.isPrimary,
      inviteStatus: m.inviteStatus,
    })),
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-brand-700 dark:text-brand-400">My Teams</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        Permanent rosters you can reuse to register for tournaments without re-inviting teammates
        each time.
      </p>
      <MyTeamsPanel initialTeams={teams} currentUserId={session.user.id} />
    </main>
  );
}
