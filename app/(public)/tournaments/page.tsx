// The standalone tournament list page was merged into /events (Current
// Tournaments tab) so there's one place to browse tournaments and event
// history instead of two. This redirects rather than 404ing for anyone
// with an old link or bookmark.

import { redirect } from 'next/navigation';

export default function TournamentsPage() {
  redirect('/events?tab=current');
}
