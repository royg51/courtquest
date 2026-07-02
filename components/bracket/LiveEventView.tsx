'use client';

// Full-screen "TV / event host" view — shows what a spectator or a screen at
// the venue wants: matches happening now, what's up next on each court, and
// the latest results. Works for any format (derives everything from the
// bracket tree). Updates arrive instantly via Realtime (see useBracket); the
// 20s interval here is just a safety net for a dropped websocket.

import Link from 'next/link';
import { useBracket } from '@/hooks/useBracket';
import type { MatchWithTeams, RoundWithMatches } from '@/types';

interface Props {
  tournamentId: string;
  tournamentName: string;
  tournamentSlug: string;
  isLive: boolean;
}

interface FlatMatch extends MatchWithTeams {
  roundName: string;
}

function flatten(rounds: RoundWithMatches[]): FlatMatch[] {
  return rounds.flatMap((r) => r.matches.map((m) => ({ ...m, roundName: r.name })));
}

function Score({ match }: { match: FlatMatch }) {
  return (
    <span className="tabular-nums">
      {match.scoreA ?? '–'} <span className="text-gray-500">–</span> {match.scoreB ?? '–'}
    </span>
  );
}

export default function LiveEventView({ tournamentId, tournamentName, tournamentSlug, isLive }: Props) {
  const { data: bracket } = useBracket(tournamentId, true, 20_000);

  const all = bracket ? flatten(bracket.rounds) : [];
  const live = all.filter((m) => m.status === 'IN_PROGRESS');
  const completed = all
    .filter((m) => m.status === 'COMPLETED')
    .reverse()
    .slice(0, 8);
  const upNext = all.filter((m) => m.status === 'PENDING' && m.teamA && m.teamB);

  return (
    <div className="min-h-screen bg-gray-950 px-6 py-8 text-gray-100">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{tournamentName}</h1>
          <p className="mt-1 text-sm text-gray-400">Live event view · updates automatically</p>
        </div>
        <div className="flex items-center gap-4">
          {isLive && (
            <span className="inline-flex items-center gap-2 rounded-full bg-red-600/20 px-3 py-1 text-sm font-semibold text-red-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              LIVE
            </span>
          )}
          <Link
            href={`/tournaments/${tournamentSlug}/bracket`}
            className="text-sm text-gray-400 hover:text-white"
          >
            Exit ↗
          </Link>
        </div>
      </header>

      {!bracket ? (
        <p className="py-24 text-center text-xl text-gray-500">Waiting for the bracket…</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* On now */}
          <section className="lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-gray-400">
              On now
            </h2>
            {live.length === 0 ? (
              <p className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-10 text-center text-gray-500">
                No matches are live right now.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {live.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-red-900/40 bg-gradient-to-br from-gray-900 to-gray-900/60 p-5"
                  >
                    <div className="mb-3 flex items-center justify-between text-xs text-gray-400">
                      <span>{m.roundName}</span>
                      {m.courtNumber && <span>Court {m.courtNumber}</span>}
                    </div>
                    <div className="space-y-1 text-xl font-semibold">
                      <div className="flex items-center justify-between">
                        <span>{m.teamA?.name ?? 'TBD'}</span>
                        <span className="tabular-nums">{m.scoreA ?? 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-300">
                        <span>{m.teamB?.name ?? 'TBD'}</span>
                        <span className="tabular-nums">{m.scoreB ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h2 className="mb-3 mt-8 text-lg font-semibold uppercase tracking-wide text-gray-400">
              Up next
            </h2>
            {upNext.length === 0 ? (
              <p className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-6 text-center text-gray-500">
                Nothing queued.
              </p>
            ) : (
              <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-900">
                {upNext.slice(0, 8).map((m) => (
                  <li key={m.id} className="flex items-center justify-between px-5 py-3">
                    <span>
                      {m.teamA?.name ?? 'TBD'} <span className="text-gray-600">vs</span>{' '}
                      {m.teamB?.name ?? 'TBD'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {m.courtNumber ? `Court ${m.courtNumber}` : m.roundName}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Recent results */}
          <section>
            <h2 className="mb-3 text-lg font-semibold uppercase tracking-wide text-gray-400">
              Latest results
            </h2>
            {completed.length === 0 ? (
              <p className="rounded-xl border border-gray-800 bg-gray-900 px-6 py-6 text-center text-gray-500">
                No results yet.
              </p>
            ) : (
              <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800 bg-gray-900">
                {completed.map((m) => {
                  const aWon = m.winnerId && m.winnerId === m.teamA?.id;
                  return (
                    <li key={m.id} className="px-5 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className={aWon ? 'font-semibold text-white' : 'text-gray-400'}>
                          {m.teamA?.name ?? 'TBD'}
                        </span>
                        <Score match={m} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={!aWon ? 'font-semibold text-white' : 'text-gray-400'}>
                          {m.teamB?.name ?? 'TBD'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
