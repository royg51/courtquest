// Bracket generation engine.
// Builds a single-elimination bracket from a list of confirmed teams.
//
// Algorithm:
//   1. Sort teams by seed (or registration order if unseeded)
//   2. Find the next power of 2 >= team count
//   3. Create rounds: log2(teamCount) rounds total
//   4. Assign teams to first-round matches (standard bracket seeding: 1 vs last, 2 vs second-to-last)
//   5. Fill bye matches where team count is not a perfect power of 2
//   6. Link each match's nextMatchId to the correct match in the following round
//   7. Set isSlotA flag so score submission knows which slot the winner fills
//   8. Persist everything in a single Prisma transaction
//
// Implemented in Step 6 (Bracket generation)

import { db as _db } from '@/lib/db';

export async function generateSingleEliminationBracket(_tournamentId: string) {
  // TODO: implement
  throw new Error('Not implemented');
}

// Returns the bracket tree denormalized for the frontend
export async function getBracketTree(_tournamentId: string) {
  // TODO: implement
  throw new Error('Not implemented');
}

// Helper: next power of 2 >= n
export function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

// Helper: round names by position from finals
export function roundName(roundsFromFinal: number): string {
  if (roundsFromFinal === 0) return 'Finals';
  if (roundsFromFinal === 1) return 'Semifinals';
  if (roundsFromFinal === 2) return 'Quarterfinals';
  return `Round of ${Math.pow(2, roundsFromFinal + 1)}`;
}
