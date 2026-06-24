// Match service layer.
// Handles score submission and automatic winner advancement through the bracket.
//
// Core logic: when a score is submitted, determine the winner, update the match,
// then place the winner into the correct slot (teamA or teamB) of nextMatch.
// If it's the final match, set tournament.status = COMPLETED.
//
// Implemented in Step 7 (Scoring + advancement)

import { db as _db } from '@/lib/db';

export async function submitScore(
  _matchId: string,
  _scores: { scoreA: number; scoreB: number }
) {
  // TODO: implement — includes winner determination and advancement
  throw new Error('Not implemented');
}

export async function getMatchById(_matchId: string) {
  // TODO: implement
  throw new Error('Not implemented');
}
