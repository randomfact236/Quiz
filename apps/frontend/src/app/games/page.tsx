/**
 * ============================================================================
 * /games — mini games hub
 * ============================================================================
 * The games themselves are plain static HTML/CSS/JS folders served from
 * public/games/<slug>/ (plan/games/README.md — no Next.js page per game); this
 * hub is the only site-shell surface. Games are fully local-first: they take
 * no URL parameters from the hub and post nothing anywhere.
 *
 * Owner asks 2026-09-28 (binding, mirrored in AGENTS.md + plan/games/README §5):
 *  1. PLAY-PREVIEW on every card — a static mid-game snapshot with the game
 *     name written directly BELOW the preview.
 *  2. TABS BY PLAYER COUNT — visible "2 Players / 3 Players / 4 Players" tab
 *     bar at the top, numbers visible outside, no dropdown (GamesBrowser).
 *     Each game carries its supported seat counts in games-registry.ts and
 *     appears in every matching tab.
 * ============================================================================
 */

import Link from 'next/link';

import { GamesBrowser } from '@/components/games/GamesBrowser';
import { GAMES } from '@/lib/games-registry';

/** Seat-count map: registry entries carry their supported player counts. */
const DEFAULT_PLAYERS: Record<string, number[]> = {
  'quad-oxo': [3, 4],
  'dots-boxes-4p': [3, 4],
  'sos-4p': [3, 4],
};

function playersFor(slug: string, declared: number[] | undefined): number[] {
  if (declared && declared.length > 0) return declared;
  return DEFAULT_PLAYERS[slug] ?? [2];
}

export default function GamesPage(): JSX.Element {
  const games = GAMES.map((game) => ({
    slug: game.slug,
    emoji: game.emoji,
    title: game.title,
    blurb: game.blurb,
    gradient: game.gradient,
    players: playersFor(
      game.slug,
      'players' in game ? (game as { players?: number[] }).players : undefined
    ),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8 dark:from-indigo-950 dark:to-secondary-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-gray-800 dark:text-secondary-100">
          🎮 Games
        </h1>
        <p className="mb-8 text-center text-gray-600 dark:text-secondary-300">
          Brain exercises you can play one-handed — no install, no signup.
        </p>

        <GamesBrowser games={games} />

        <div className="mt-10 text-center">
          <Link
            href="/play"
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            Prefer quizzes and riddles? Head to the Play Hub →
          </Link>
        </div>
      </div>
    </div>
  );
}
