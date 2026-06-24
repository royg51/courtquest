// Single match card within the bracket.
// Shows: teamA name/seed, teamB name/seed, scores (if completed), winner highlight.
// In organizer mode: clicking opens ScoreEntryModal.
// Implemented in Step 6 (Bracket viewer).

import type { MatchWithTeams } from '@/types';

interface Props {
  match: MatchWithTeams;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

export default function MatchCard(_props: Props) {
  return <div>MatchCard — not yet implemented</div>;
}
