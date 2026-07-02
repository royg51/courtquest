// Live event / TV mode — public, full-screen, auto-updating. Meant to be put
// on a screen at the venue or watched by remote spectators.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getTournamentBySlug } from '@/lib/tournaments';
import LiveEventView from '@/components/bracket/LiveEventView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const [tournament, session] = await Promise.all([getTournamentBySlug(params.slug), auth()]);
  if (!tournament) return { title: 'Live' };
  if (!tournament.isPublic) {
    const canView =
      session?.user?.id === tournament.organizer.id || session?.user?.role === 'ADMIN';
    if (!canView) return { title: 'Live' };
  }
  return {
    title: `${tournament.name} — Live`,
    description: `Live scores and order of play for ${tournament.name}.`,
    robots: { index: false },
  };
}

export default async function LivePage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { invite?: string };
}) {
  const [tournament, session] = await Promise.all([getTournamentBySlug(params.slug), auth()]);
  if (!tournament) notFound();

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

  return (
    <LiveEventView
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      tournamentSlug={tournament.slug}
      isLive={tournament.status === 'IN_PROGRESS'}
    />
  );
}
