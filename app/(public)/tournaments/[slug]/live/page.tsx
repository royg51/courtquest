// Live event / TV mode — public, full-screen, auto-updating. Meant to be put
// on a screen at the venue or watched by remote spectators.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/tournaments';
import LiveEventView from '@/components/bracket/LiveEventView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) return { title: 'Live' };
  return {
    title: `${tournament.name} — Live`,
    description: `Live scores and order of play for ${tournament.name}.`,
    robots: { index: false },
  };
}

export default async function LivePage({ params }: { params: { slug: string } }) {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) notFound();

  return (
    <LiveEventView
      tournamentId={tournament.id}
      tournamentName={tournament.name}
      tournamentSlug={tournament.slug}
      isLive={tournament.status === 'IN_PROGRESS'}
    />
  );
}
