/**
 * Hangman Relay MP (T30 3P + F30 4P, ONE core) — PURE core, backend-owned.
 *
 * The classic hangman, trust-relayed: every seat WRITES a secret word for the
 * NEXT seat around the table, then everyone races to solve THEIR OWN puzzle
 * (the word written for them), one letter per turn in rotation. A correct
 * letter reveals it; a wrong letter is a strike. 6 strikes and you are out
 * (your word is revealed). Solvers rank by solve order; struck-out seats rank
 * by fewer strikes.
 *
 * EMPTY-BOARD: words are PLAYER-CREATED (typed by the players — no word
 * lists, no served content). Bot words are algorithmic pseudo-words; bots
 * guess by letter-frequency strategy only (their own puzzle's public state).
 *
 * SECRET: a word nobody has settled yet never crosses the API except to the
 * seat that wrote it — the adapter's redactFor enforces that.
 */

export const HM_MAX_STRIKES = 6;
export const HM_WORD_MIN = 3;
export const HM_WORD_MAX = 12;
export const HM_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export interface HmPuzzle {
  length: number;
  /** Positional reveal: the letter when guessed, null while hidden. */
  mask: (string | null)[];
  /** Correctly guessed letters (unique, in guess order). */
  revealed: string[];
  /** Wrong guesses (unique, in guess order). */
  wrong: string[];
  /** The owner solved their own puzzle. */
  solved: boolean;
  /** 6 strikes — out of the relay. */
  out: boolean;
}

export interface HmState {
  phase: 'writing' | 'solving' | 'finished';
  /** words[i] = the word WRITTEN BY seat i (it belongs to puzzle (i+1)%n). */
  words: (string | null)[];
  /** puzzles[i] = the puzzle FOR seat i (word written by (i-1+n)%n). */
  puzzles: (HmPuzzle | null)[];
  /** Seats in the order they solved (1st, 2nd, ...). */
  solveOrder: number[];
  turn: number;
  seatCount: number;
}

export interface HmPlacement {
  seat: number;
  rank: number;
}

export function hmInitialState(seatCount: number): HmState {
  return {
    phase: 'writing',
    words: Array.from({ length: seatCount }, () => null),
    puzzles: Array.from({ length: seatCount }, () => null),
    solveOrder: [],
    turn: 0,
    seatCount,
  };
}

/** Normalize + validate a player-written word: letters only, 3-12 long. */
export function hmNormalizeWord(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length < HM_WORD_MIN || clean.length > HM_WORD_MAX) return null;
  return clean;
}

export function hmValidLetter(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const clean = raw.toUpperCase();
  return clean.length === 1 && HM_LETTERS.includes(clean) ? clean : null;
}

export function hmValidateMove(state: HmState, seat: number, move: unknown): string | null {
  if (state.phase === 'writing') {
    if (state.words[seat] !== null) return 'You already wrote your word.';
    if (hmNormalizeWord((move as { word?: unknown })?.word) === null)
      return 'Words are 3-12 letters (A-Z).';
    return null;
  }
  if (state.phase === 'solving') {
    if (state.turn !== seat) return 'Not your turn.';
    const p = state.puzzles[seat];
    if (!p) return 'No puzzle for this seat.';
    if (p.solved || p.out) return 'Your puzzle is settled — the relay skips you.';
    const letter = hmValidLetter((move as { letter?: unknown })?.letter);
    if (!letter) return 'Guess one letter (A-Z).';
    if (p.revealed.includes(letter) || p.wrong.includes(letter))
      return 'That letter was already guessed.';
    return null;
  }
  return 'This table has finished.';
}

export function hmApplyMove(
  state: HmState,
  seat: number,
  move: { word?: unknown; letter?: unknown }
): HmState {
  if (state.phase === 'writing') {
    const word = hmNormalizeWord(move.word) as string;
    const words = state.words.slice();
    words[seat] = word;
    const puzzles = state.puzzles.slice();
    puzzles[(seat + 1) % state.seatCount] = {
      length: word.length,
      mask: Array.from({ length: word.length }, () => null),
      revealed: [],
      wrong: [],
      solved: false,
      out: false,
    };
    if (words.every((w) => w !== null)) {
      return { ...state, words, puzzles, phase: 'solving', turn: 0 };
    }
    return { ...state, words, puzzles };
  }
  const letter = hmValidLetter(move.letter) as string;
  const puzzles = state.puzzles.slice();
  const p = { ...(puzzles[seat] as HmPuzzle) };
  const word = state.words[(seat - 1 + state.seatCount) % state.seatCount] as string;
  const solveOrder = state.solveOrder.slice();
  if (word.includes(letter)) {
    p.revealed = [...p.revealed, letter];
    p.mask = word.split('').map((ch) => (p.revealed.includes(ch) ? ch : null));
    const unique = Array.from(new Set(word.split('')));
    if (unique.every((ch) => p.revealed.includes(ch))) {
      p.solved = true;
      solveOrder.push(seat);
    }
  } else {
    p.wrong = [...p.wrong, letter];
    if (p.wrong.length >= HM_MAX_STRIKES) p.out = true;
  }
  puzzles[seat] = p;
  const next = { ...state, puzzles, solveOrder };
  const nextSeat = hmNextActive(next, seat);
  if (nextSeat < 0) return { ...next, phase: 'finished' };
  return { ...next, turn: nextSeat };
}

function hmNextActive(state: HmState, afterSeat: number): number {
  for (let k = 1; k <= state.seatCount; k++) {
    const s = (afterSeat + k) % state.seatCount;
    const p = state.puzzles[s];
    if (p && !p.solved && !p.out) return s;
  }
  return -1;
}

export function hmIsOver(state: HmState): boolean {
  return state.phase === 'finished';
}

/** Rank game — the placement list orders everyone; no single winner seat. */
export function hmWinner(): number | null {
  return null;
}

/**
 * Placement: solvers in solve order first (but a solver who was faster ranks
 * higher), then struck-out seats by fewer strikes. Every seat appears once.
 */
export function hmPlacement(state: HmState): HmPlacement[] {
  const out: HmPlacement[] = [];
  const ranked = new Set<number>();
  state.solveOrder.forEach((seat, i) => {
    out.push({ seat, rank: i + 1 });
    ranked.add(seat);
  });
  const rest: number[] = [];
  for (let s = 0; s < state.seatCount; s++) if (!ranked.has(s)) rest.push(s);
  rest.sort((a, b) => {
    const pa = state.puzzles[a];
    const pb = state.puzzles[b];
    const wa = pa ? pa.wrong.length : HM_MAX_STRIKES;
    const wb = pb ? pb.wrong.length : HM_MAX_STRIKES;
    return wa - wb || a - b;
  });
  rest.forEach((s, i) => out.push({ seat: s, rank: state.solveOrder.length + i + 1 }));
  return out;
}

/**
 * Bot word: algorithmic pseudo-word (consonant/vowel weave — no lists, ever).
 * Deterministic per seat so replays are stable.
 */
export function hmBotWord(seat: number): string {
  const vowels = 'AEIOU';
  const cons = 'BCDFGHJKLMNPRSTVWZ';
  const len = 4 + (seat % 3); // 4-6 letters
  let word = '';
  for (let k = 0; k < len; k++) {
    word +=
      k % 2 === 0
        ? cons[(seat * 3 + k * 7) % cons.length]
        : vowels[(seat * 2 + k * 3) % vowels.length];
  }
  return word;
}

/**
 * Bot letter: frequency-order strategy over the window's PUBLIC state.
 * easy: varied deterministic pick; medium/hard: strict frequency order.
 */
export function hmBotLetter(
  state: HmState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): string {
  const order = 'EARIOTNSLCHDMUPGBFYWKVXZJQ';
  const p = state.puzzles[seat] as HmPuzzle;
  const used = new Set<string>([...p.revealed, ...p.wrong]);
  const avail = order.split('').filter((ch) => !used.has(ch));
  if (avail.length === 0) return 'A';
  if (tier === 'easy') return avail[(seat * 5 + p.wrong.length * 3) % avail.length];
  return avail[0];
}

/**
 * Redaction: a freshly written word is visible ONLY to the seat that wrote it
 * (they know it anyway) and to everyone once its puzzle settles (solved or
 * struck out). Finished tables reveal everything — it is a reveal game.
 */
export function hmRedactFor(state: HmState, seat: number | null): HmState {
  if (state.phase === 'finished') return state;
  const n = state.seatCount;
  const words = state.words.map((w, i) => {
    if (w === null) return null;
    if (seat !== null && i === seat) return w;
    const p = state.puzzles[(i + 1) % n];
    if (p && (p.solved || p.out)) return w;
    return null;
  });
  return { ...state, words };
}
