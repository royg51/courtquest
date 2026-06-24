// Public tournament detail page.
// Shows info, registration button, and bracket (if generated).
// Implemented in Step 3 (Tournament listing) + Step 6 (Bracket viewer).

export default function TournamentDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return <div>Tournament: {params.slug} — not yet implemented</div>;
}
