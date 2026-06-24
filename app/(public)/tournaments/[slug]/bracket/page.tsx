// Public read-only bracket view for a tournament.
// Polls GET /api/tournaments/[id]/bracket every 30s for live updates.
// Implemented in Step 6 (Bracket viewer).

export default function BracketPage({
  params,
}: {
  params: { slug: string };
}) {
  return <div>Bracket for {params.slug} — not yet implemented</div>;
}
