/**
 * ============================================================================
 * games-registry.ts — the eight static mini games, one source of truth
 * ============================================================================
 * The hub page (/games), the OG share-image generator (/og/game/<slug>.png)
 * and the static games' head metadata all describe the same dependency-free
 * folders under public/games/<slug>/ (plan/games/README.md). `cssGradient`
 * mirrors each card's Tailwind from/to pair in raw CSS because satori cannot
 * resolve Tailwind classes. Server-safe: no client APIs.
 * ============================================================================
 */

export interface GameEntry {
  slug: string;
  emoji: string;
  title: string;
  blurb: string;
  /** Tailwind gradient classes for the hub card. */
  gradient: string;
  /** Raw CSS gradient for the satori share image. */
  cssGradient: string;
}

export const GAMES: GameEntry[] = [
  {
    slug: 'tap-or-dont-tap',
    emoji: '🚦',
    title: "Tap or Don't Tap",
    blurb:
      'Tap the green, resist the red. A Go/No-Go reaction test — how fast are you in milliseconds?',
    gradient: 'from-emerald-500 to-teal-600',
    cssGradient: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
  },
  {
    slug: 'tic-tac-toe',
    emoji: '⭕',
    title: 'Tic Tac Toe',
    blurb: 'Pass-and-play or take on the computer — hard is unbeatable. Misère rule for the brave.',
    gradient: 'from-cyan-500 to-blue-600',
    cssGradient: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
  },
  {
    slug: 'sliding-puzzle',
    emoji: '🧩',
    title: 'Sliding Puzzle',
    blurb:
      'Slide the tiles into order — 3×3 to 5×5, picture mode, hard mode and a new daily challenge.',
    gradient: 'from-amber-500 to-orange-600',
    cssGradient: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
  },
  {
    slug: 'word-puzzle',
    emoji: '🔤',
    title: 'Word Puzzle',
    blurb:
      'Drag to find hidden words in themed letter grids — hints, stars and beatable best times.',
    gradient: 'from-rose-500 to-pink-600',
    cssGradient: 'linear-gradient(135deg, #f43f5e 0%, #db2777 100%)',
  },
  {
    slug: 'hurdle-runner',
    emoji: '🏃',
    title: 'Hurdle Runner',
    blurb: 'Endless hurdle sprint — jump, grab 💚 hearts and chase the day-to-night horizon.',
    gradient: 'from-lime-500 to-green-600',
    cssGradient: 'linear-gradient(135deg, #84cc16 0%, #16a34a 100%)',
  },
  {
    slug: 'flying-snake',
    emoji: '🐍',
    title: 'Flying Snake',
    blurb: 'Flappy-style flying snake — thread the gaps and climb from bronze to platinum medals.',
    gradient: 'from-sky-500 to-indigo-600',
    cssGradient: 'linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)',
  },
  {
    slug: 'spirit-runner',
    emoji: '🌲',
    title: 'Spirit Runner',
    blurb:
      'Mystical forest runner — rune gates, orbs and powers, and the shadow realm for the bold.',
    gradient: 'from-violet-500 to-purple-600',
    cssGradient: 'linear-gradient(135deg, #8b5cf6 0%, #9333ea 100%)',
  },
  {
    slug: 'memory-quiz',
    emoji: '🧠',
    title: 'Memory Quiz',
    blurb: 'Memorize the snack grid before the timer runs out — then prove where everything was.',
    gradient: 'from-fuchsia-500 to-rose-600',
    cssGradient: 'linear-gradient(135deg, #d946ef 0%, #e11d48 100%)',
  },
];

export function findGame(slug: string): GameEntry | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** Hub-card accents for /og/games.png (games hub) and /og/play.png (Play Hub). */
export const GAMES_HUB_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';
export const PLAY_HUB_GRADIENT = 'linear-gradient(135deg, #A5A3E4 0%, #8f7fd8 45%, #BF7076 100%)';
