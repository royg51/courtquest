// Registration page for a tournament.
// Logged-in users register directly. If the tournament allows guest
// registration, logged-out visitors get a guest form; otherwise they're sent
// to login first.

import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTournamentBySlug } from '@/lib/tournaments';
import RegistrationForm from '@/components/registration/RegistrationForm';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [tournament, session] = await Promise.all([getTournamentBySlug(params.slug), auth()]);
  if (!tournament) return {};
  if (!tournament.isPublic) {
    const canView =
      session?.user?.id === tournament.organizer.id || session?.user?.role === 'ADMIN';
    if (!canView) return {};
  }
  return pageMetadata({
    title: `Register — ${tournament.name}`,
    description: `Register your team for ${tournament.name}.`,
    path: `/tournaments/${params.slug}/register`,
    noindex: true,
  });
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { invite?: string };
}) {
  const [session, tournament] = await Promise.all([auth(), getTournamentBySlug(params.slug)]);
  if (!tournament) {
    notFound();
  }

  // Private tournaments: accessible to organizer, admins, or valid invite-code holders.
  if (!tournament.isPublic) {
    const hasInvite =
      !!searchParams.invite &&
      !!tournament.inviteCode &&
      searchParams.invite.toUpperCase() === tournament.inviteCode;
    const canView =
      hasInvite ||
      session?.user?.id === tournament.organizer.id ||
      session?.user?.role === 'ADMIN';
    if (!canView) notFound();
  }

  // Logged-out visitors are allowed through only if this tournament permits
  // guest registration; otherwise send them to login first.
  const isGuest = !session?.user;
  if (isGuest && !tournament.allowGuestRegistration) {
    redirect(`/login?callbackUrl=/tournaments/${params.slug}/register`);
  }

  if (tournament.status !== 'OPEN') {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Registration isn&apos;t open
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {tournament.name} is not currently accepting registrations.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="mx-auto max-w-md px-4 pt-8 text-2xl font-bold text-brand-700 dark:text-brand-400">
        Register for {tournament.name}
      </h1>
      <RegistrationForm
        tournamentId={tournament.id}
        tournamentSlug={tournament.slug}
        teamSize={tournament.teamSize as 1 | 2}
        requiresPayment={tournament.requiresPayment}
        entryFeeCents={tournament.entryFeeCents}
        guestMode={isGuest}
      />
    </main>
  );
}
