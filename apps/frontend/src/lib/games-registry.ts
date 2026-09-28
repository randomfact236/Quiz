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
  /**
   * Supported seat counts (owner rule 2026-09-28: the /games hub tabs by
   * player count â€” 2 Players / 3 Players / 4 Players). Default [2] when
   * omitted. Party games list every seat count they support.
   */
  players?: number[];
}

export const GAMES: GameEntry[] = [
  {
    slug: 'rock-paper-scissors',
    emoji: '✊',
    title: 'Rock Paper Scissors',
    blurb: 'Best of five in under a minute — quickfire throws, simultaneous reveal, no cheating.',
    gradient: 'from-purple-600 to-fuchsia-700',
    cssGradient: 'linear-gradient(135deg, #9333ea 0%, #a21caf 100%)',
  },
  {
    slug: 'pig-dice',
    emoji: '🎲',
    title: 'Pig Dice',
    blurb: 'Roll to build a turn score — bank it or push your luck. First to the target wins.',
    gradient: 'from-emerald-500 to-lime-600',
    cssGradient: 'linear-gradient(135deg, #10b981 0%, #65a30d 100%)',
  },
  {
    slug: 'battleship',
    emoji: '🚢',
    title: 'Battleship',
    blurb: 'Place your own fleet, then hunt your opponent — solo vs computer or a live duel.',
    gradient: 'from-slate-600 to-slate-900',
    cssGradient: 'linear-gradient(135deg, #475569 0%, #0f172a 100%)',
  },
  {
    slug: 'dots-and-boxes',
    emoji: '🔵',
    title: 'Dots and Boxes',
    blurb:
      'Draw lines, close boxes, keep the initiative — solo vs the computer or duel a friend live.',
    gradient: 'from-sky-500 to-blue-700',
    cssGradient: 'linear-gradient(135deg, #0ea5e9 0%, #1d4ed8 100%)',
  },
  {
    slug: 'connect-four',
    emoji: '🔴',
    title: 'Connect Four',
    blurb: 'Drop discs, line up four — solo vs the computer or a live duel with a friend.',
    gradient: 'from-amber-500 to-red-600',
    cssGradient: 'linear-gradient(135deg, #f59e0b 0%, #dc2626 100%)',
  },
  {
    slug: 'gomoku',
    emoji: '⚫',
    title: 'Gomoku',
    blurb: 'Five in a row on a 15×15 board — solo vs the computer or duel a friend live.',
    gradient: 'from-amber-600 to-yellow-700',
    cssGradient: 'linear-gradient(135deg, #d97706 0%, #a16207 100%)',
  },
  {
    slug: 'tic-tac-toe',
    emoji: '⭕',
    title: 'Tic Tac Toe',
    blurb: 'Pass-and-play, take on the computer, or duel a friend online — hard is unbeatable.',
    gradient: 'from-cyan-500 to-blue-600',
    cssGradient: 'linear-gradient(135deg, #06b6d4 0%, #2563eb 100%)',
  },
  {
    slug: 'checkers',
    emoji: '⛓️',
    title: 'Checkers',
    blurb:
      'Jump, capture, crown — forced captures and multi-jump chains, solo vs the computer or a live duel.',
    gradient: 'from-amber-600 to-rose-700',
    cssGradient: 'linear-gradient(135deg, #d97706 0%, #be123c 100%)',
  },

  {
    slug: 'dots-boxes-4p',
    players: [3, 4],
    emoji: 'â¬œ',
    title: 'Dots & Boxes 4P',
    blurb: 'Four players draw edges and claim boxes â€” the chain giveaway decides everything.',
    gradient: 'from-sky-500 to-indigo-700',
    cssGradient: 'linear-gradient(135deg, #0ea5e9 0%, #4338ca 100%)',
  },
  {
    slug: 'sos-4p',
    players: [3, 4],
    emoji: 'âœï¸',
    title: 'SOS 4P',
    blurb: 'Complete SOS lines to score and go again â€” four players, one paper grid.',
    gradient: 'from-rose-500 to-orange-600',
    cssGradient: 'linear-gradient(135deg, #f43f5e 0%, #ea580c 100%)',
  },
  {
    slug: 'othello-3',
    emoji: '⚫',
    title: 'Othello-3',
    blurb: 'Three colours, one 10×10 board — flank and flip to the biggest army.',
    gradient: 'from-emerald-600 to-teal-800',
    cssGradient: 'linear-gradient(135deg, #059669 0%, #134e4a 100%)',
    players: [3],
  },
  {
    slug: 'quadflip',
    emoji: '🔃',
    title: 'QuadFlip',
    blurb: 'Four colours on 14×14 — the classic four-player flip battle.',
    gradient: 'from-violet-600 to-indigo-800',
    cssGradient: 'linear-gradient(135deg, #7c3aed 0%, #3730a3 100%)',
    players: [4],
  },
  {
    slug: 'tri-nim',
    emoji: 'ðŸ¥¢',
    title: 'Tri-Nim',
    blurb: 'Take 1-3 sticks from a row â€” whoever takes the LAST stick is 3rd. Three players.',
    gradient: 'from-amber-500 to-orange-700',
    cssGradient: 'linear-gradient(135deg, #f59e0b 0%, #c2410c 100%)',
    players: [3],
  },
  {
    slug: 'connect-four-mp',
    emoji: 'ðŸ”´',
    title: 'Connect Four MP',
    blurb: 'Drop discs, line up four â€” three players on 8Ã—8 or four on 10Ã—10.',
    gradient: 'from-rose-600 to-pink-700',
    cssGradient: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
    players: [3, 4],
  },
  {
    slug: 'quad-oxo',
    players: [3, 4],
    emoji: 'ðŸŽ®',
    title: 'Quad-OXO',
    blurb:
      'Four players, one 5x5 grid - first four in a row wins. Empty seats are bots, so start anytime.',
    gradient: 'from-indigo-500 to-purple-700',
    cssGradient: 'linear-gradient(135deg, #6366f1 0%, #7e22ce 100%)',
  },
];

export function findGame(slug: string): GameEntry | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** Hub-card accents for /og/games.png (games hub) and /og/play.png (Play Hub). */
export const GAMES_HUB_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';
export const PLAY_HUB_GRADIENT = 'linear-gradient(135deg, #A5A3E4 0%, #8f7fd8 45%, #BF7076 100%)';
