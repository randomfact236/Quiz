/**
 * ============================================================================
 * /games — mini games hub
 * ============================================================================
 * The games themselves are plain static HTML/CSS/JS folders served from
 * public/games/<slug>/ (plan/games/README.md — no Next.js page per game); this
 * hub is the only site-shell surface. Games are fully local-first: they take
 * no URL parameters from the hub and post nothing anywhere.
 * ============================================================================
 */

import Link from 'next/link';

import { GameShareButton } from '@/components/games/GameShareButton';
import { GAMES } from '@/lib/games-registry';

export default function GamesPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8 dark:from-indigo-950 dark:to-secondary-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-gray-800 dark:text-secondary-100">
          🎮 Games
        </h1>
        <p className="mb-10 text-center text-gray-600 dark:text-secondary-300">
          Brain exercises you can play one-handed — no install, no signup.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {GAMES.map((game) => (
            <div
              key={game.slug}
              className={`relative flex items-center gap-4 rounded-2xl bg-gradient-to-r ${game.gradient} p-5 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <a
                href={`/games/${game.slug}/index.html`}
                className="flex min-w-0 flex-1 items-center gap-4"
              >
                <span className="text-4xl">{game.emoji}</span>
                <span className="flex-1">
                  <span className="block text-lg font-bold">{game.title}</span>
                  <span className="block text-sm text-white/90">{game.blurb}</span>
                </span>
              </a>
              {/* BUG-035: hub-level share — result shares live in each game's
                  own result screen; this spreads the game itself. */}
              <GameShareButton slug={game.slug} title={game.title} blurb={game.blurb} />
            </div>
          ))}
        </div>

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
