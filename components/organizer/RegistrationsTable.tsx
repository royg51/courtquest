'use client';

import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useTeams } from '@/hooks/useRegistration';
import type { TeamWithMembers } from '@/lib/teams';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

interface Props {
  tournamentId: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-brand-50 text-brand-700',
  WAITLISTED: 'bg-amber-50 text-amber-700',
  WITHDRAWN: 'bg-gray-100 text-gray-400',
};

export default function RegistrationsTable({ tournamentId }: Props) {
  const { data: teams, isLoading } = useTeams(tournamentId);
  const queryClient = useQueryClient();

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
    return <p className="text-sm text-gray-500">Loading registrations…</p>;
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
        <div key={team.id} className="rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900">{team.name}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[team.status]}`}
            >
              {team.status}
            </span>
          </div>
          <ul className="mt-2 text-sm text-gray-600">
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
                className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Confirm
              </button>
            )}
            {team.status === 'CONFIRMED' && (
              <button
                type="button"
                onClick={() => updateStatus(team.id, 'WAITLISTED')}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Move to Waitlist
              </button>
            )}
            {team.status !== 'WITHDRAWN' && (
              <button
                type="button"
                onClick={() => updateStatus(team.id, 'WITHDRAWN')}
                className="rounded-md border border-gray-300 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
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
