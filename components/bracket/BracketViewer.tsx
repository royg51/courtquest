// Read-only bracket viewer — used on the public tournament page and the
// organizer bracket management page. Renders rounds left-to-right with
// SVG connector lines linking each match to the one it advances into.
// When `mode="organizer"`, MatchCards show a score entry control.
//
// Layout math: matches are ordered by `position` within a round, and the
// bracket engine (lib/bracket.ts) links match `m` in round r to match
// `Math.floor(m / 2)` in round r+1. A CSS grid with `ROW_PX`-tall rows lets
// each match span `2^round` rows and center itself — connector coordinates
// follow the same span math, so the lines land exactly on each card's
// visual center without ever measuring the DOM.

import type { BracketTree } from '@/types';
import MatchCard from './MatchCard';

interface Props {
  bracket: BracketTree;
  mode?: 'public' | 'organizer';
  onScoreSubmit?: (matchId: string) => void;
}

// Tall enough to fit a card in organizer mode with the score-entry button
// showing (the tallest case) without adjacent rows visually overlapping.
const ROW_PX = 168;
const COLUMN_WIDTH = 240;
const CONNECTOR_WIDTH = 40;
const HEADER_HEIGHT = 40;

export default function BracketViewer({ bracket, mode = 'public', onScoreSubmit }: Props) {
  const firstRoundCount = bracket.rounds[0]?.matches.length ?? 0;
  const totalHeight = firstRoundCount * ROW_PX;

  if (firstRoundCount === 0) return null;

  return (
    <div>
      {bracket.rounds.length > 1 && (
        <p className="mb-2 text-xs text-gray-400 dark:text-gray-500 sm:hidden">
          Scroll sideways to see the full bracket →
        </p>
      )}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-start" style={{ minWidth: 'fit-content' }}>
        {bracket.rounds.map((round, roundIndex) => {
          const span = firstRoundCount / round.matches.length;
          const isLastRound = roundIndex === bracket.rounds.length - 1;

          return (
            <div key={round.id} className="flex items-start">
              <div style={{ width: COLUMN_WIDTH }} className="shrink-0">
                <div
                  style={{ height: HEADER_HEIGHT }}
                  className="flex items-center justify-center"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {round.name}
                  </h3>
                </div>
                <div
                  style={{ display: 'grid', gridTemplateRows: `repeat(${firstRoundCount}, ${ROW_PX}px)` }}
                >
                  {round.matches.map((match, i) => (
                    <div
                      key={match.id}
                      style={{ gridRow: `${i * span + 1} / span ${span}`, alignSelf: 'center' }}
                    >
                      <MatchCard match={match} mode={mode} onScoreSubmit={onScoreSubmit} />
                    </div>
                  ))}
                </div>
              </div>

              {!isLastRound && (
                <svg
                  width={CONNECTOR_WIDTH}
                  height={totalHeight}
                  style={{ marginTop: HEADER_HEIGHT }}
                  className="shrink-0 text-gray-300 dark:text-gray-700"
                  aria-hidden="true"
                >
                  {round.matches.map((match, i) => {
                    if (i % 2 !== 0) return null;
                    const sibling = round.matches[i + 1];
                    const centerA = (i * span + span / 2) * ROW_PX;
                    const centerB = sibling ? ((i + 1) * span + span / 2) * ROW_PX : centerA;
                    const midX = CONNECTOR_WIDTH / 2;
                    const stubColor = (m: typeof match) =>
                      m.status === 'COMPLETED' || m.status === 'BYE'
                        ? 'stroke-brand-500 dark:stroke-brand-400'
                        : 'stroke-current';

                    return (
                      <g key={match.id} strokeWidth={2} fill="none">
                        <line x1={0} y1={centerA} x2={midX} y2={centerA} className={stubColor(match)} />
                        {sibling && (
                          <line x1={0} y1={centerB} x2={midX} y2={centerB} className={stubColor(sibling)} />
                        )}
                        <line x1={midX} y1={centerA} x2={midX} y2={centerB} className="stroke-current" />
                        <line
                          x1={midX}
                          y1={(centerA + centerB) / 2}
                          x2={CONNECTOR_WIDTH}
                          y2={(centerA + centerB) / 2}
                          className="stroke-current"
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
