// Registration page for a tournament.
// Logged-in users register directly. If the tournament allows guest
// registration, logged-out visitors get a guest form; otherwise they're sent
// to login first.

import type { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTournamentBySlug } from '@/lib/tournaments';
import { getMyPermanentTeams } from '@/lib/permanentTeams';
import RegistrationForm from '@/components/registration/RegistrationForm';
import { pageMetadata } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) return {};
  return pageMetadata({
    title: `Register — ${tournament.name}`,
    description: `Register your team for ${tournament.name}.`,
    path: `/tournaments/${params.slug}/register`,
    noindex: true,
  });
}

export default async function RegisterPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) {
    notFound();
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

  // Permanent teams only make sense for doubles, logged-in registrants, with
  // a full accepted roster of the right size.
  const myPermanentTeams =
    !isGuest && tournament.teamSize === 2
      ? (await getMyPermanentTeams(session!.user.id))
          .filter((t) => t.members.filter((m) => m.inviteStatus === 'ACCEPTED').length === 2)
          .map((t) => ({ id: t.id, name: t.name }))
      : [];

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
        myPermanentTeams={myPermanentTeams}
      />
    </main>
  );
}
