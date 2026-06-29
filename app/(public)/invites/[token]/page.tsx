// Invite accept/decline landing page. Public — viewing an invite never
// requires login, but accepting does (the response identifies who joined).

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Mail, Check, X } from 'lucide-react';

interface InviteDetails {
  kind: 'tournament' | 'permanent';
  teamName: string;
  context: string;
  invitedEmail: string | null;
  status: string;
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/invites/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          setInvite(null);
          return;
        }
        const { invite } = await res.json();
        setInvite(invite);
      })
      .finally(() => setLoading(false));
  }, [params.token]);

  const respond = async (action: 'accept' | 'decline') => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${params.token}/${action}`, { method: 'POST' });
      if (!res.ok) {
        const error = await res.json().catch(() => null);
        toast.error(error?.error ?? `Failed to ${action} invite`);
        return;
      }
      toast.success(action === 'accept' ? "You're on the team!" : 'Invite declined');
      router.push(action === 'accept' ? '/dashboard' : '/');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || sessionStatus === 'loading') {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center text-sm text-gray-500 dark:text-gray-400">
        Loading invite…
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invite not found</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          This invite link is invalid or has expired.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <Mail className="mx-auto h-8 w-8 text-brand-600 dark:text-brand-400" aria-hidden="true" />
      <h1 className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">
        Join &quot;{invite.teamName}&quot;
      </h1>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        You&apos;ve been invited to join this team for {invite.context}.
      </p>

      {invite.status !== 'PENDING' ? (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          This invite has already been {invite.status.toLowerCase()}.
        </p>
      ) : !session?.user ? (
        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign in or create an account to accept.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href={`/login?callbackUrl=/invites/${params.token}`}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Log in
            </Link>
            <Link
              href={`/signup?callbackUrl=/invites/${params.token}`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Sign up
            </Link>
          </div>
          <button
            type="button"
            onClick={() => respond('decline')}
            disabled={submitting}
            className="mt-2 text-sm text-gray-500 underline hover:text-gray-700 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Decline invite
          </button>
        </div>
      ) : (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => respond('accept')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Accept
          </button>
          <button
            type="button"
            onClick={() => respond('decline')}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" /> Decline
          </button>
        </div>
      )}
    </main>
  );
}
