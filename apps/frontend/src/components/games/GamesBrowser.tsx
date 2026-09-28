/**
 * ============================================================================
 * GamesBrowser — the /games tab bar (owner ask 2026-09-28)
 * ============================================================================
 * Owner rule: CLEAR SEPARATION by player count — visible tabs "2 Players /
 * 3 Players / 4 Players" at the top of the games page, numbers visible
 * OUTSIDE (no dropdown, nothing hidden): one tap selects the group. A game
 * appears in every tab it supports (2P duels → "2 Players"; party tables →
 * "3 Players" AND "4 Players" with a badge). The rule is binding for any AI
 * adding games — mirrored in AGENTS.md §2D Games and plan/games/README.md §5.
 * ============================================================================
 */

'use client';

import { useState } from 'react';

import { GamePlayPreview } from '@/components/games/GamePlayPreview';
import { GameShareButton } from '@/components/games/GameShareButton';

export interface GameCard {
  slug: string;
  emoji: string;
  title: string;
  blurb: string;
  gradient: string;
  /** Seat counts this game supports, e.g. [2] or [3, 4]. */
  players: number[];
}

const TABS: ReadonlyArray<{ key: number; label: string }> = [
  { key: 2, label: '2 Players' },
  { key: 3, label: '3 Players' },
  { key: 4, label: '4 Players' },
];

export function GamesBrowser({ games }: { games: GameCard[] }): JSX.Element {
  const [tab, setTab] = useState<number>(2);
  const visible = games.filter((g) => g.players.includes(tab));

  return (
    <div>
      {/* Visible tab bar — player counts outside, no dropdown (owner rule). */}
      <div
        className="mb-8 flex justify-center gap-2"
        role="tablist"
        aria-label="Filter games by player count"
      >
        {TABS.map(({ key, label }) => {
          const count = games.filter((g) => g.players.includes(key)).length;
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2.5 text-sm font-extrabold transition-all sm:px-5 ${
                active
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white dark:bg-white/10 dark:text-secondary-200 dark:hover:bg-white/20'
              }`}
            >
              {label} <span className={active ? 'text-white/80' : 'opacity-50'}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Owner ask 2026-09-28: always show how many games are created. */}
      <p className="mb-6 text-center text-sm font-semibold text-gray-600 dark:text-secondary-300">
        ðŸŽ® {games.length} game{games.length === 1 ? '' : 's'} created Â· {visible.length} in this
        tab
      </p>

      {visible.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-secondary-400">
          No games here yet — new tables are on the way.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {visible.map((game) => (
            <div
              key={game.slug}
              className={`relative flex flex-col rounded-2xl bg-gradient-to-r ${game.gradient} p-4 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <a
                href={`/games/${game.slug}/index.html`}
                className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center"
              >
                {/* Play-preview tile: how the game looks mid-play. */}
                <span className="relative w-full">
                  <GamePlayPreview slug={game.slug} />
                  {/* Player-count badge — visible on every card. */}
                  <span className="absolute right-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-xs font-bold text-white">
                    {game.players.join(' · ')}P
                  </span>
                </span>
                {/* Name sits directly below the preview (owner layout). */}
                <span className="block pt-1 text-lg font-bold">{game.title}</span>
                <span className="block text-sm text-white/90">{game.blurb}</span>
              </a>
              {/* BUG-035: hub-level share — result shares live in each game's
                  own result screen; this spreads the game itself. */}
              <div className="absolute left-3 top-3">
                <GameShareButton slug={game.slug} title={game.title} blurb={game.blurb} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
