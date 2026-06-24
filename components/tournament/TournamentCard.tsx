// Tournament summary card used in list and dashboard views.
// Shows: name, dates, sport, format badge, status badge, registration count, CTA button.
// Implemented in Step 3 (Tournament listing).

import type { Tournament } from '@prisma/client';

interface Props {
  tournament: Pick<Tournament, 'id' | 'slug' | 'name' | 'sport' | 'format' | 'status' | 'startDate' | 'venue' | 'teamSize'>;
}

export default function TournamentCard(_props: Props) {
  return <div>TournamentCard — not yet implemented</div>;
}
