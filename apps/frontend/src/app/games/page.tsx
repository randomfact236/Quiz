/**
 * ============================================================================
 * /games — mini games hub
 * ============================================================================
 * The games themselves are plain static HTML/CSS/JS folders served from
 * public/games/<slug>/ (plan/games/README.md — no Next.js page per game); this
 * hub is the only site-shell surface. Games are fully local-first: they take
 * no URL parameters from the hub and post nothing anywhere.
 *
 * Owner asks 2026-09-28 (binding, mirrored in AGENTS.md §2D + plan/games/README §5):
 *  1. PLAY-PREVIEW on every card — a static mid-game snapshot with the game
 *     name directly BELOW the preview.
 *  2. TABS BY PLAYER COUNT — visible "2 Players / 3 Players / 4 Players" tab
 *     bar at the top, numbers visible outside, no dropdown (GamesBrowser).
 *  3. ALWAYS-VISIBLE created-games counter.
 *  4. Layout Restructure pass: 3-column responsive grid + refined card
 *     anatomy (GamesBrowser) per owner feedback.
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
  'tri-nim': [3],
  'connect-four-mp': [3, 4],
  'othello-3': [3],
  quadflip: [4],
  'ultimate-ttt-mp': [3, 4],
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#E8E4F3] via-[#EDE7F6] to-[#D4C5E8] px-4 py-10 dark:from-indigo-950 dark:via-[#1a1a3e] dark:to-secondary-950">
      {/* Atmosphere: soft ambient orbs instead of a flat gradient. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-indigo-400/20 blur-3xl dark:bg-indigo-600/20"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl dark:bg-fuchsia-600/10"
      />

      <div className="relative mx-auto max-w-5xl">
        <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-gray-900 dark:text-secondary-50 sm:text-5xl">
          🎮 Games
        </h1>
        <p className="mb-10 text-center text-gray-600 dark:text-secondary-300">
          Brain exercises you can play one-handed — no install, no signup.
        </p>

        <GamesBrowser games={games} />

        <div className="mt-12 text-center">
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
