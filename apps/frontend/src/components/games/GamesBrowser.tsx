/**
 * ============================================================================
 * GamesBrowser — the /games tab bar + card grid (owner asks 2026-09-28)
 * ============================================================================
 * Owner rules (binding, mirrored in AGENTS.md §2D + plan/games/README §5):
 *  - VISIBLE tabs "2 Players / 3 Players / 4 Players" at the top, numbers
 *    outside, NO dropdown; one tap selects the group.
 *  - Play-preview snapshot with the game name directly BELOW it.
 *  - Always-visible created-games counter.
 *  - Layout Restructure (2026-09-28, owner feedback): 3-column responsive
 *    grid with a refined card anatomy — preview tile, name, blurb, footer
 *    with share + badge. Same data, same rules, better rhythm.
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
      {/* Player-count tabs — visible outside, no dropdown (owner rule). */}
      <div
        className="mx-auto mb-5 flex w-fit gap-1.5 rounded-2xl bg-white/60 p-1.5 shadow-sm ring-1 ring-black/5 backdrop-blur dark:bg-white/10 dark:ring-white/10"
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
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all sm:px-5 ${
                active
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/70 hover:text-gray-900 dark:text-secondary-300 dark:hover:bg-white/10 dark:hover:text-white'
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs ${active ? 'text-white/75' : 'opacity-45'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Always-visible created-games counter (owner rule). */}
      <p className="mb-8 text-center text-sm font-medium text-gray-500 dark:text-secondary-400">
        🎮 {games.length} game{games.length === 1 ? '' : 's'} created · {visible.length} in this tab
      </p>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-gray-500 dark:text-secondary-400">
          No games here yet — new tables are on the way.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((game) => (
            <article
              key={game.slug}
              className={`group relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${game.gradient} text-white shadow-md ring-1 ring-black/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl dark:ring-white/10`}
            >
              {/* Sheen: subtle diagonal light sweep on hover. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />
              <a
                href={`/games/${game.slug}/index.html`}
                className="flex min-w-0 flex-1 flex-col p-4"
                aria-label={`Play ${game.title}`}
              >
                {/* Play-preview tile: how the game looks mid-play. */}
                <span className="relative block overflow-hidden rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur-[2px] transition-transform duration-300 group-hover:scale-[1.02]">
                  <GamePlayPreview slug={game.slug} />
                  {/* Player-count badge — visible on every card. */}
                  <span className="absolute right-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[11px] font-bold tracking-wide text-white">
                    {game.players.join(' · ')}P
                  </span>
                </span>
                {/* Name directly below the preview (owner rule). */}
                <span className="mt-3 block truncate text-base font-extrabold tracking-tight">
                  {game.title}
                </span>
                <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-white/85">
                  {game.blurb}
                </span>
              </a>
              {/* Card footer: share isolated from the card link. */}
              <div className="flex items-center justify-between border-t border-white/15 px-4 py-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
                  Play now
                </span>
                <GameShareButton slug={game.slug} title={game.title} blurb={game.blurb} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
