// Shared between sentry.client/server/edge.config.ts.
//
// next/navigation's redirect() and notFound() work by throwing a special
// error that Next's own router catches further up the tree — marked via a
// `.digest` property, not just the message text. These are control flow,
// not bugs: every logged-out visit to /dashboard throws one. Filtering by
// digest (rather than just message string matching) is the reliable way
// to catch these regardless of exact wording across Next.js versions.
export function isExpectedNextError(error: unknown): boolean {
  const digest = (error as { digest?: string } | null)?.digest;
  if (!digest) return false;
  return digest === 'NEXT_NOT_FOUND' || digest.startsWith('NEXT_REDIRECT');
}
