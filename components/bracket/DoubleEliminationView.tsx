// Double-elimination bracket layout.
//
// The Winners Bracket is structurally identical to a single-elimination
// bracket (every round exactly halves the previous one), so it's rendered
// through the existing BracketViewer unchanged. The Losers Bracket's round
// sizes don't cleanly halve and round 1 may have fewer matches than the
// structural maximum (dead slots are simply never created — see
// lib/formats/double-elimination.ts), so connector-line math doesn't apply
// there; it gets a simpler column layout instead. Grand Finals (plus the
// lazily-created bracket-reset match, if any) gets its own small section.

import type { BracketTree, TeamSummary } from '@/types';
import BracketViewer from './BracketViewer';
import MatchCard from './MatchCard';

interface Props {
  bracket: BracketTree;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

// The deciding Grand Finals match is whichever GRAND_FINALS round has the
// highest number — that's the reset (game two) if one was created, or game
// one if it wasn't. Null until that match actually has a winner.
export function getDoubleEliminationChampion(bracket: BracketTree): TeamSummary | null {
  const grandFinals = bracket.rounds
    .filter((r) => r.bracketSide === 'GRAND_FINALS')
    .sort((a, b) => b.number - a.number);
  const decidingMatch = grandFinals[0]?.matches[0];
  if (!decidingMatch?.winnerId) return null;
  return decidingMatch.teamA?.id === decidingMatch.winnerId
    ? decidingMatch.teamA
    : decidingMatch.teamB;
}

export default function DoubleEliminationView({ bracket, mode = 'public', onScoreSubmit }: Props) {
  const winnersRounds = bracket.rounds.filter((r) => r.bracketSide === 'WINNERS');
  const losersRounds = bracket.rounds.filter((r) => r.bracketSide === 'LOSERS');
  const grandFinalsRounds = bracket.rounds
    .filter((r) => r.bracketSide === 'GRAND_FINALS')
    .sort((a, b) => a.number - b.number);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
          Winners Bracket
        </h2>
        <BracketViewer
          bracket={{ id: bracket.id, generatedAt: bracket.generatedAt, rounds: winnersRounds }}
          mode={mode}
          onScoreSubmit={onScoreSubmit}
        />
      </section>

      {losersRounds.length > 0 && (
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
            Losers Bracket
          </h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex items-start gap-6" style={{ minWidth: 'fit-content' }}>
              {losersRounds.map((round) => (
                <div key={round.id} className="w-56 shrink-0 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {round.name}
                  </h3>
                  {round.matches.map((match) => (
                    <MatchCard key={match.id} match={match} mode={mode} onScoreSubmit={onScoreSubmit} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-gray-100">
          Grand Finals
        </h2>
        <div className="flex flex-wrap items-start gap-6">
          {grandFinalsRounds.map((round) => (
            <div key={round.id} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{round.name}</h3>
              {round.matches.map((match) => (
                <MatchCard key={match.id} match={match} mode={mode} onScoreSubmit={onScoreSubmit} />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
