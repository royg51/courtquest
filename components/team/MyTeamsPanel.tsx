'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserPlus, Plus } from 'lucide-react';
import { TextField } from '@/components/ui/TextField';
import { SPORTS } from '@/lib/sports';

interface Member {
  id: string;
  name: string;
  isPrimary: boolean;
  inviteStatus: string;
}

interface PermanentTeam {
  id: string;
  name: string;
  sport: string;
  members: Member[];
}

export default function MyTeamsPanel({
  initialTeams,
  currentUserId: _currentUserId,
}: {
  initialTeams: PermanentTeam[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const createTeam = async () => {
    if (!name.trim()) return;
    setSubmitting('create');
    try {
      const res = await fetch('/api/permanent-teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sport }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to create team');
        return;
      }
      toast.success('Team created');
      setCreating(false);
      setName('');
      router.refresh();
      const { team } = await res.json();
      setTeams((prev) => [
        {
          id: team.id,
          name: team.name,
          sport: team.sport,
          members: team.members.map((m: { id: string; isPrimary: boolean; inviteStatus: string; user: { name: string } | null }) => ({
            id: m.id,
            name: m.user?.name ?? 'Pending invite',
            isPrimary: m.isPrimary,
            inviteStatus: m.inviteStatus,
          })),
        },
        ...prev,
      ]);
    } finally {
      setSubmitting(null);
    }
  };

  const inviteMember = async (teamId: string) => {
    const email = inviteEmails[teamId]?.trim();
    if (!email) return;
    setSubmitting(teamId);
    try {
      const res = await fetch(`/api/permanent-teams/${teamId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to send invite');
        return;
      }
      toast.success('Invite sent');
      setInviteEmails((prev) => ({ ...prev, [teamId]: '' }));
      router.refresh();
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> Create a team
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
          <TextField label="Team name" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={createTeam}
              disabled={submitting === 'create'}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting === 'create' ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {teams.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          You don&apos;t have any saved teams yet.
        </p>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <Link
                  href={`/teams/${team.id}`}
                  className="font-semibold text-gray-900 hover:underline dark:text-gray-100"
                >
                  {team.name}
                </Link>
                <span className="text-xs text-gray-500 dark:text-gray-400">{team.sport}</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                {team.members.map((m) => (
                  <li key={m.id} className="flex items-center gap-2">
                    {m.name}
                    {m.isPrimary && <span className="text-xs text-gray-400">(captain)</span>}
                    {m.inviteStatus !== 'ACCEPTED' && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {m.inviteStatus.toLowerCase()}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <input
                  type="email"
                  placeholder="Invite by email"
                  value={inviteEmails[team.id] ?? ''}
                  onChange={(e) => setInviteEmails((prev) => ({ ...prev, [team.id]: e.target.value }))}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => inviteMember(team.id)}
                  disabled={submitting === team.id}
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Invite
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
