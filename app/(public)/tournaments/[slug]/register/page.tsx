// Registration page for a tournament.
// Requires auth — redirects to login if not signed in.
// Implemented in Step 5 (Registration flow).

export default function RegisterPage({
  params,
}: {
  params: { slug: string };
}) {
  return <div>Register for {params.slug} — not yet implemented</div>;
}
