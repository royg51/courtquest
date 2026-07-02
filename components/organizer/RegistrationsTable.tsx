'use client';

import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useTeams } from '@/hooks/useRegistration';
import { useRealtimeInvalidate } from '@/hooks/useSupabaseRealtime';
import type { TeamWithMembers } from '@/lib/teams';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

interface Props {
  tournamentId: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  CONFIRMED: 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400',
  WAITLISTED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  WITHDRAWN: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500',
};

export default function RegistrationsTable({ tournamentId }: Props) {
  const { data: teams, isLoading } = useTeams(tournamentId);
  const queryClient = useQueryClient();

  // New registrations (or status/withdraw changes from another tab/organizer)
  // show up live instead of needing a manual refresh.
  useRealtimeInvalidate({ table: 'Team', filter: `tournamentId=eq.${tournamentId}` }, [
    'teams',
    tournamentId,
  ]);

  const updateStatus = async (teamId: string, status: string) => {
    const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => null);
      toast.error(error?.error ?? 'Failed to update registration');
      return;
    }
    toast.success('Registration updated');
    queryClient.invalidateQueries({ queryKey: ['teams', tournamentId] });
  };

  if (isLoading) {
    return (
      <p className="px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading registrations…
      </p>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No registrations yet"
        description="Once players register, they'll show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {teams.map((team: TeamWithMembers) => (
        <div key={team.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{team.name}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[team.status]}`}
            >
              {team.status}
            </span>
          </div>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {team.members.map((member: TeamWithMembers['members'][number]) => (
              <li key={member.id}>
                {member.user?.name ?? member.guestName ?? 'Unknown'}
                {member.skillLevel ? ` · ${member.skillLevel}` : ''}
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            {team.status !== 'CONFIRMED' && team.status !== 'WITHDRAWN' && (
              <button
                type="button"
                onClick={() => updateStatus(team.id, 'CONFIRMED')}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Confirm
              </button>
            )}
            {team.status === 'CONFIRMED' && (
              <button
                type="button"
                onClick={() => updateStatus(team.id, 'WAITLISTED')}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Move to Waitlist
              </button>
            )}
            {team.status !== 'WITHDRAWN' && (
              <button
                type="button"
                onClick={() => updateStatus(team.id, 'WITHDRAWN')}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-gray-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Withdraw
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
