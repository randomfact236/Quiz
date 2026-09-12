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

interface GameCard {
  slug: string;
  emoji: string;
  title: string;
  blurb: string;
  gradient: string;
}

const GAMES: GameCard[] = [
  {
    slug: 'tap-or-dont-tap',
    emoji: '🚦',
    title: "Tap or Don't Tap",
    blurb:
      'Tap the green, resist the red. A Go/No-Go reaction test — how fast are you in milliseconds?',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    slug: 'tic-tac-toe',
    emoji: '⭕',
    title: 'Tic Tac Toe',
    blurb: 'Pass-and-play or take on the computer — hard is unbeatable. Misère rule for the brave.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    slug: 'sliding-puzzle',
    emoji: '🧩',
    title: 'Sliding Puzzle',
    blurb:
      'Slide the tiles into order — 3×3 to 5×5, picture mode, hard mode and a new daily challenge.',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    slug: 'word-puzzle',
    emoji: '🔤',
    title: 'Word Puzzle',
    blurb:
      'Drag to find hidden words in themed letter grids — hints, stars and beatable best times.',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    slug: 'hurdle-runner',
    emoji: '🏃',
    title: 'Hurdle Runner',
    blurb: 'Endless hurdle sprint — jump, grab 💚 hearts and chase the day-to-night horizon.',
    gradient: 'from-lime-500 to-green-600',
  },
  {
    slug: 'flying-snake',
    emoji: '🐍',
    title: 'Flying Snake',
    blurb: 'Flappy-style flying snake — thread the gaps and climb from bronze to platinum medals.',
    gradient: 'from-sky-500 to-indigo-600',
  },
  {
    slug: 'spirit-runner',
    emoji: '🌲',
    title: 'Spirit Runner',
    blurb:
      'Mystical forest runner — rune gates, orbs and powers, and the shadow realm for the bold.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    slug: 'memory-quiz',
    emoji: '🧠',
    title: 'Memory Quiz',
    blurb: 'Memorize the snack grid before the timer runs out — then prove where everything was.',
    gradient: 'from-fuchsia-500 to-rose-600',
  },
];

export default function GamesPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8 dark:from-indigo-950 dark:to-secondary-950">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-center text-4xl font-extrabold tracking-tight text-gray-800 dark:text-secondary-100">
          🎮 Mini Games
        </h1>
        <p className="mb-10 text-center text-gray-600 dark:text-secondary-300">
          Quick games you can play one-handed — no install, no signup.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {GAMES.map((game) => (
            <a
              key={game.slug}
              href={`/games/${game.slug}/`}
              className={`flex items-center gap-4 rounded-2xl bg-gradient-to-r ${game.gradient} p-5 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl`}
            >
              <span className="text-4xl">{game.emoji}</span>
              <span className="flex-1">
                <span className="block text-lg font-bold">{game.title}</span>
                <span className="block text-sm text-white/90">{game.blurb}</span>
              </span>
            </a>
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
