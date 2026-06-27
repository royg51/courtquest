// Create new tournament page — the real implementation lives at
// /dashboard/tournaments/new. This redirects rather than duplicating it.

import { redirect } from 'next/navigation';

export default function NewTournamentPage() {
  redirect('/dashboard/tournaments/new');
}
