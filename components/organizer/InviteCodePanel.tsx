'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Copy, RefreshCw, Ticket } from 'lucide-react';

export default function InviteCodePanel({
  tournamentId,
  initialCode,
  appUrl,
  allowGuestRegistration,
}: {
  tournamentId: string;
  initialCode: string | null;
  appUrl: string;
  allowGuestRegistration: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);

  const joinUrl = code ? `${appUrl}/join/${code}` : null;

  const generate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/invite-code`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? 'Failed to generate code');
        return;
      }
      const { inviteCode } = await res.json();
      setCode(inviteCode);
      toast.success('Invite code ready');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copied');
  };

  return (
    <div className="mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100">
        <Ticket className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        Invite / join code
      </div>

      {code ? (
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-gray-100 px-3 py-1.5 font-mono text-lg font-semibold tracking-widest text-gray-900 dark:bg-gray-800 dark:text-gray-100">
              {code}
            </span>
            <button
              type="button"
              onClick={() => copy(code)}
              className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Copy code"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="rounded-md border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              aria-label="Regenerate code"
            >
              <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {joinUrl && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="truncate">{joinUrl}</span>
              <button
                type="button"
                onClick={() => copy(joinUrl)}
                className="shrink-0 rounded border border-gray-300 px-2 py-0.5 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Copy link
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3">
          <button
            type="button"
            onClick={generate}
            disabled={busy}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? 'Generating…' : 'Generate invite code'}
          </button>
        </div>
      )}

      {!allowGuestRegistration && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Tip: people will still need an account to register. Turn on “Allow guest registration” in
          Edit Details to let them join without signing up.
        </p>
      )}
    </div>
  );
}
