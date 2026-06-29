// Group-stage match cards, grouped by group number — separate from group
// standings (GroupStandingsTable) and from whatever playoff bracket follows
// (BracketViewer/DoubleEliminationView), since a group stage's round-robin
// shape doesn't fit either of those layouts. Column layout per group, same
// pattern as DoubleEliminationView's losers-bracket section.

import type { BracketTree } from '@/types';
import MatchCard from './MatchCard';

interface Props {
  bracket: BracketTree;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

export default function GroupStageMatchesView({ bracket, mode = 'public', onScoreSubmit }: Props) {
  const groupRounds = bracket.rounds.filter((r) => r.groupNumber !== null);
  if (groupRounds.length === 0) return null;

  const byGroup = new Map<number, typeof groupRounds>();
  for (const round of groupRounds) {
    const groupNumber = round.groupNumber!;
    if (!byGroup.has(groupNumber)) byGroup.set(groupNumber, []);
    byGroup.get(groupNumber)!.push(round);
  }

  const groups = [...byGroup.entries()].sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-8">
      {groups.map(([groupNumber, rounds]) => (
        <section key={groupNumber}>
          <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Group {groupNumber} matches
          </h3>
          <div className="overflow-x-auto pb-4">
            <div className="flex items-start gap-6" style={{ minWidth: 'fit-content' }}>
              {rounds
                .slice()
                .sort((a, b) => a.number - b.number)
                .map((round) => (
                  <div key={round.id} className="w-56 shrink-0 space-y-3">
                    <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {round.name}
                    </h4>
                    {round.matches.map((match) => (
                      <MatchCard key={match.id} match={match} mode={mode} onScoreSubmit={onScoreSubmit} />
                    ))}
                  </div>
                ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
