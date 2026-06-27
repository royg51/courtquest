// Public read-only bracket view for a tournament.
// Polls GET /api/tournaments/[id]/bracket every 30s while IN_PROGRESS.

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTournamentBySlug } from '@/lib/tournaments';
import PublicBracketView from '@/components/bracket/PublicBracketView';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) return {};
  return { title: `${tournament.name} — Bracket` };
}

export default async function BracketPage({ params }: { params: { slug: string } }) {
  const tournament = await getTournamentBySlug(params.slug);
  if (!tournament) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-brand-700">{tournament.name} — Bracket</h1>
      <PublicBracketView
        tournamentId={tournament.id}
        isLive={tournament.status === 'IN_PROGRESS'}
      />
    </main>
  );
}
