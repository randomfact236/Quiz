/**
 * ============================================================================
 * games-registry.ts — the static mini games, one source of truth
 * ============================================================================
 * The hub page (/games), the OG share-image generator (/og/game/<slug>.png)
 * and the static games' head metadata all describe the same dependency-free
 * folders under public/games/<slug>/ (plan/games/README.md). `cssGradient`
 * mirrors each card's Tailwind from/to pair in raw CSS because satori cannot
 * resolve Tailwind classes. Server-safe: no client APIs.
 *
 * Owner decision 2026-09-28: the games family pivoted to EMPTY-BOARD games —
 * nothing pre-filled, every move made by a player (solo vs easy/medium/hard
 * AI, online duel with invite codes). The seven pre-filled/pattern games were
 * archived to _archive/games/ untouched. Tic-tac-toe is the prototype of the
 * new family; Connect Four and Gomoku follow the same template.
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
    slug: 'connect-four',
    emoji: '🔴',
    title: 'Connect Four',
    blurb: 'Drop discs, line up four — solo vs the computer or a live duel with a friend.',
    gradient: 'from-amber-500 to-red-600',
    cssGradient: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
  },
  {
    slug: 'tic-tac-toe',
    emoji: '⭕',
    title: 'Tic Tac Toe',
    blurb: 'Pass-and-play, take on the computer, or duel a friend online — hard is unbeatable.',
    gradient: 'from-cyan-500 to-blue-600',
    cssGradient: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
  },
];

export function findGame(slug: string): GameEntry | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** Hub-card accents for /og/games.png (games hub) and /og/play.png (Play Hub). */
export const GAMES_HUB_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';
export const PLAY_HUB_GRADIENT = 'linear-gradient(135deg, #A5A3E4 0%, #8f7fd8 45%, #BF7076 100%)';
