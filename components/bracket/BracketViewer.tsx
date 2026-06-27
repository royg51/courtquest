// Read-only bracket viewer — used on the public tournament page and the
// organizer bracket management page. Renders rounds left-to-right with
// MatchCards stacked vertically within each round (no SVG connector lines —
// simple column layout, which is enough to read the bracket without the
// extra complexity of drawing connectors for an MVP).
// When `mode="organizer"`, MatchCards show a score entry control.

import type { BracketTree } from '@/types';
import MatchCard from './MatchCard';

interface Props {
  bracket: BracketTree;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

export default function BracketViewer({ bracket, mode = 'public', onScoreSubmit }: Props) {
  return (
    <div className="flex gap-8 overflow-x-auto pb-4">
      {bracket.rounds.map((round) => (
        <div key={round.id} className="flex flex-col gap-6">
          <h3 className="text-center text-sm font-semibold text-gray-900">{round.name}</h3>
          <div className="flex flex-1 flex-col justify-around gap-6">
            {round.matches.map((match) => (
              <MatchCard key={match.id} match={match} mode={mode} onScoreSubmit={onScoreSubmit} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
