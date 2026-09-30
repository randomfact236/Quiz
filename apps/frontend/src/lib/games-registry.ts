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
    slug: 'pente',
    emoji: '⚫',
    title: 'Pente',
    blurb:
      'Five in a row — but flanking a pair captures it. The meaner cousin of Gomoku, solo or live.',
    gradient: 'from-stone-600 to-stone-800',
    cssGradient: 'linear-gradient(135deg, #57534e 0%, #1c1917 100%)',
  },
  {
    slug: 'go',
    emoji: '⛔',
    title: 'Go 9×9',
    blurb:
      'The deepest game ever played, on a board you can finish — surround territory, solo or live.',
    gradient: 'from-lime-700 to-green-900',
    cssGradient: 'linear-gradient(135deg, #3f6212 0%, #14532d 100%)',
  },
  {
    slug: 'chess',
    emoji: '♞',
    title: 'Chess',
    blurb: 'The most famous game in existence, full ruleset — castling, en passant, promotion.',
    gradient: 'from-neutral-600 to-neutral-900',
    cssGradient: 'linear-gradient(135deg, #52525b 0%, #18181b 100%)',
  },
  {
    slug: 'othello',
    emoji: '⚫',
    title: 'Othello',
    blurb:
      'Outflank to flip — the classic flip duel, solo vs the computer or a live match with a friend.',
    gradient: 'from-emerald-600 to-teal-800',
    cssGradient: 'linear-gradient(135deg, #059669 0%, #134e4a 100%)',
  },

  {
    slug: 'dots-boxes-4p',
    players: [3, 4],
    emoji: '⬜',
    title: 'Dots & Boxes 4P',
    blurb: 'Four players draw edges and claim boxes — the chain giveaway decides everything.',
    gradient: 'from-sky-500 to-indigo-700',
    cssGradient: 'linear-gradient(135deg, #0ea5e9 0%, #4338ca 100%)',
  },
  {
    slug: 'sos-4p',
    players: [3, 4],
    emoji: '✏️',
    title: 'SOS 4P',
    blurb: 'Complete SOS lines to score and go again — four players, one paper grid.',
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
    slug: 'snakes-ladders-mp',
    emoji: '🎲',
    title: 'Snakes & Ladders MP',
    blurb: 'The classic 1-100 race: climb ladders, dodge snakes, first to 100.',
    gradient: 'from-lime-500 to-emerald-800',
    cssGradient: 'linear-gradient(135deg, #84cc16 0%, #166534 100%)',
    players: [3, 4],
  },
  {
    slug: 'memory-flip-mp',
    emoji: '🃏',
    title: 'Memory Flip MP',
    blurb: 'Flip two cards: a match scores and keeps your turn. Most pairs wins.',
    gradient: 'from-fuchsia-600 to-purple-900',
    cssGradient: 'linear-gradient(135deg, #c026d3 0%, #581c87 100%)',
    players: [3, 4],
  },
  {
    slug: 'code-race',
    emoji: '🔍',
    title: 'Code Race',
    blurb: 'One maker invents a secret code — the rest race to crack it first.',
    gradient: 'from-slate-600 to-slate-900',
    cssGradient: 'linear-gradient(135deg, #475569 0%, #0f172a 100%)',
    players: [3, 4],
  },
  {
    slug: 'notakto-mp',
    emoji: '❌',
    title: 'Notakto MP',
    blurb: 'Three boards, everyone places X — three in a row and you are OUT.',
    gradient: 'from-red-600 to-rose-900',
    cssGradient: 'linear-gradient(135deg, #dc2626 0%, #881337 100%)',
    players: [3, 4],
  },
  {
    slug: 'ultimate-ttt-mp',
    emoji: '#️⃣',
    title: 'Ultimate TTT MP',
    blurb: 'Nine boards at once — where you play decides where they must play. 3 or 4 players.',
    gradient: 'from-cyan-600 to-blue-800',
    cssGradient: 'linear-gradient(135deg, #0891b2 0%, #1e40af 100%)',
    players: [3, 4],
  },
  {
    slug: 'tri-nim',
    emoji: '🥢',
    title: 'Tri-Nim',
    blurb: 'Take 1-3 sticks from a row — whoever takes the LAST stick is 3rd. Three players.',
    gradient: 'from-amber-500 to-orange-700',
    cssGradient: 'linear-gradient(135deg, #f59e0b 0%, #c2410c 100%)',
    players: [3],
  },
  {
    slug: 'connect-four-mp',
    emoji: '🔴',
    title: 'Connect Four MP',
    blurb: 'Drop discs, line up four — three players on 8×8 or four on 10×10.',
    gradient: 'from-rose-600 to-pink-700',
    cssGradient: 'linear-gradient(135deg, #e11d48 0%, #be185d 100%)',
    players: [3, 4],
  },
  {
    slug: 'quad-oxo',
    players: [3, 4],
    emoji: '🎮',
    title: 'Quad-OXO',
    blurb:
      'Four players, one 5x5 grid - first four in a row wins. Empty seats are bots, so start anytime.',
    gradient: 'from-indigo-500 to-purple-700',
    cssGradient: 'linear-gradient(135deg, #6366f1 0%, #7e22ce 100%)',
  },
  {
    slug: 'ludo-mp',
    emoji: '🏁',
    title: 'Ludo MP',
    blurb:
      'The classic cross-board race - roll, deploy, capture, first home wins. Empty seats are bots.',
    gradient: 'from-rose-500 to-indigo-700',
    cssGradient: 'linear-gradient(135deg, #f43f5e 0%, #4338ca 100%)',
    players: [3, 4],
  },
  {
    slug: 'ludo-snakes',
    emoji: '🐍',
    title: 'Ludo Snakes',
    blurb:
      'Ludo with 5 ladders and 4 snakes on the ring - ride them to victory. Empty seats are bots.',
    gradient: 'from-teal-500 to-emerald-900',
    cssGradient: 'linear-gradient(135deg, #14b8a6 0%, #064e3b 100%)',
    players: [3, 4],
  },
  {
    slug: 'checkers-hex',
    emoji: '🔴',
    title: 'Checkers Hex',
    blurb: 'Three-corner checkers for three - mandatory jumps, last seat standing wins.',
    gradient: 'from-red-500 to-stone-800',
    cssGradient: 'linear-gradient(135deg, #ef4444 0%, #292524 100%)',
    players: [3],
  },
  {
    slug: 'checkers-4p',
    emoji: '⚫',
    title: 'Checkers 4P',
    blurb: 'Four-sided checkers on the big board - mandatory jumps, last seat standing wins.',
    gradient: 'from-zinc-500 to-neutral-900',
    cssGradient: 'linear-gradient(135deg, #71717a 0%, #171717 100%)',
    players: [4],
  },
  {
    slug: 'blokus-4p',
    emoji: '🟦',
    title: 'Blokus 4P',
    blurb:
      'The 20x20 corner-touch original - place all 21 pieces, most squares wins. Empty seats are bots.',
    gradient: 'from-sky-500 to-blue-900',
    cssGradient: 'linear-gradient(135deg, #0ea5e9 0%, #1e3a8a 100%)',
    players: [4],
  },
  {
    slug: 'dominoes-mp',
    emoji: '🤶',
    title: 'Dominoes Block MP',
    blurb:
      'The classic tile chain - match the open ends, shed your hand, lowest pips wins a block. Empty seats are bots.',
    gradient: 'from-neutral-400 to-stone-800',
    cssGradient: 'linear-gradient(135deg, #a3a3a3 0%, #1c1917 100%)',
    players: [3, 4],
  },
  {
    slug: 'crazy-eights-mp',
    emoji: '🃏',
    title: 'Crazy Eights MP',
    blurb: 'Match suit or value, eights are wild - shed your hand first. Empty seats are bots.',
    gradient: 'from-emerald-500 to-cyan-800',
    cssGradient: 'linear-gradient(135deg, #10b981 0%, #155e75 100%)',
    players: [3, 4],
  },
  {
    slug: 'yatzy-mp',
    emoji: '🎲',
    title: 'Yatzy MP',
    blurb:
      'Five dice, three rolls, fifteen categories - the classic scorecard race. Empty seats are bots.',
    gradient: 'from-amber-400 to-red-700',
    cssGradient: 'linear-gradient(135deg, #fbbf24 0%, #b91c1c 100%)',
    players: [3, 4],
  },
  {
    slug: 'bulls-race-mp',
    emoji: '🐂',
    title: 'Bulls Race',
    blurb:
      "First to 4 bulls cracks the maker's code - bulls only, 15 guesses each. Empty seats are bots.",
    gradient: 'from-orange-500 to-rose-900',
    cssGradient: 'linear-gradient(135deg, #f97316 0%, #881337 100%)',
    players: [3, 4],
  },
  {
    slug: 'hangman-relay-mp',
    emoji: '✍️',
    title: 'Hangman Relay',
    blurb:
      "Write a secret word for the next seat, then race to solve your own - six strikes and you're out. Empty seats are bots.",
    gradient: 'from-slate-400 to-slate-800',
    cssGradient: 'linear-gradient(135deg, #94a3b8 0%, #1e293b 100%)',
    players: [3, 4],
  },
  {
    slug: 'pig-dice-mp',
    emoji: '🐷',
    title: 'Pig Dice MP',
    blurb:
      'Push your luck to 100 - roll for the pot, hold to bank it, a 1 wipes it clean. Empty seats are bots.',
    gradient: 'from-pink-400 to-rose-800',
    cssGradient: 'linear-gradient(135deg, #f472b6 0%, #9f1239 100%)',
    players: [3, 4],
  },
];

export function findGame(slug: string): GameEntry | undefined {
  return GAMES.find((game) => game.slug === slug);
}

/** Hub-card accents for /og/games.png (games hub) and /og/play.png (Play Hub). */
export const GAMES_HUB_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #d946ef 100%)';
export const PLAY_HUB_GRADIENT = 'linear-gradient(135deg, #A5A3E4 0%, #8f7fd8 45%, #BF7076 100%)';
