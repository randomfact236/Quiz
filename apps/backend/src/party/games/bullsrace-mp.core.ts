/**
 * Bulls Race MP (T28 3P + F28 4P, ONE core) — PURE core, backend-owned.
 *
 * Bulls & Cows fame, the family sibling of Code Race (T27): ONE maker
 * invents a hidden 4-digit code (digits 0-9, repeats allowed); the OTHER
 * seats race to crack it, one guess per turn in rotation, up to 15 guesses
 * each. Feedback per guess: BULLS ONLY (right digit, right position) — no
 * cows, so every deduction is positional. First to 4 bulls cracks the code
 * and takes 1st. If the limit passes with no crack: maker 1st, breakers
 * ranked by their best single guess (bulls desc) then attempts.
 *
 * EMPTY-BOARD: the code is PLAYER-CREATED (the maker types it). Bot breakers
 * deduce honestly from their own feedback only (never reading the code).
 * No word lists, no served content.
 *
 * SECRET: the code must be stripped from every view while the game runs —
 * the adapter exposes redactFor (see party-adapters) and the service applies
 * it before any state crosses the API.
 */

export const BR_SECRET_LEN = 4;
export const BR_DIGITS = 10; // digits 0..9
export const BR_GUESS_LIMIT = 15;

export interface BrRow {
  guess: number[];
  bulls: number;
}

export interface BrState {
  phase: 'setting' | 'racing' | 'finished';
  /** Secret code — NEVER crosses the API while phase != finished. */
  code: number[] | null;
  makerSeat: number;
  breakerSeats: number[];
  /** Per-seat guess history. */
  rows: Record<string, BrRow[]>;
  turn: number;
  seatCount: number;
}

export interface BrPlacement {
  seat: number;
  rank: number;
}

export function brInitialState(seatCount: number): BrState {
  return {
    phase: 'setting',
    code: null,
    makerSeat: 0,
    breakerSeats: Array.from({ length: seatCount - 1 }, (_, i) => i + 1),
    rows: {},
    turn: 0,
    seatCount,
  };
}

export function brValidCode(code: unknown): string | null {
  if (!Array.isArray(code) || code.length !== BR_SECRET_LEN) return 'The code must be 4 digits.';
  for (const v of code) {
    if (!Number.isInteger(v) || v < 0 || v > BR_DIGITS - 1) return 'Digits must be 0-9.';
  }
  return null;
}

export function brValidateMove(state: BrState, seat: number, move: unknown): string | null {
  if (state.phase === 'setting') {
    if (seat !== state.makerSeat) return 'Only the code-maker sets the code.';
    return brValidCode((move as { code?: number[] })?.code);
  }
  if (state.phase === 'racing') {
    if (seat === state.makerSeat) return 'The maker does not guess.';
    if (state.turn !== seat) return 'Not your turn.';
    return brValidCode((move as { guess?: number[] })?.guess);
  }
  return 'This table has finished.';
}

/** Bulls only: right digit, right position. */
export function brScoreGuess(code: number[], guess: number[]): number {
  let bulls = 0;
  for (let i = 0; i < BR_SECRET_LEN; i++) {
    if (guess[i] === code[i]) bulls += 1;
  }
  return bulls;
}

/** Apply: setting phase sets the code; racing phase records a scored guess. */
export function brApplyMove(
  state: BrState,
  seat: number,
  move: { code?: number[]; guess?: number[] }
): BrState {
  if (state.phase === 'setting') {
    return {
      ...state,
      phase: 'racing',
      code: (move.code as number[]).slice(),
      turn: state.breakerSeats[0],
    };
  }
  const guess = (move.guess as number[]).slice();
  const bulls = brScoreGuess(state.code as number[], guess);
  const key = String(seat);
  const rows = { ...state.rows, [key]: [...(state.rows[key] ?? []), { guess, bulls }] };
  const next = { ...state, rows, turn: brNextBreaker(state, seat) };
  if (brIsOver(next)) next.phase = 'finished';
  return next;
}

function brNextBreaker(state: BrState, seat: number): number {
  const idx = state.breakerSeats.indexOf(seat);
  return state.breakerSeats[(idx + 1) % state.breakerSeats.length];
}

function brBullsOf(state: BrState, seat: number): number {
  return (state.rows[String(seat)] ?? []).reduce((a, r) => a + r.bulls, 0);
}

function brBestGuess(state: BrState, seat: number): number {
  return (state.rows[String(seat)] ?? []).reduce((a, r) => Math.max(a, r.bulls), 0);
}

function brGuessesOf(state: BrState, seat: number): number {
  return (state.rows[String(seat)] ?? []).length;
}

export function brIsOver(state: BrState): boolean {
  if (state.phase === 'setting') return false;
  if (state.phase === 'finished') return true;
  const cracked = state.breakerSeats.some((s) =>
    (state.rows[String(s)] ?? []).some((r) => r.bulls === BR_SECRET_LEN)
  );
  if (cracked) return true;
  return state.breakerSeats.every((s) => brGuessesOf(state, s) >= BR_GUESS_LIMIT);
}

/**
 * Placement: first crack = 1st; other breakers by (best guess desc, guesses
 * asc); maker last. No crack at the limit: maker 1st, breakers by best guess
 * desc — the maker survived the race.
 */
export function brPlacement(state: BrState): BrPlacement[] {
  const out: BrPlacement[] = [];
  const breakers = state.breakerSeats.slice();
  const crackedSeat =
    breakers.find((s) => (state.rows[String(s)] ?? []).some((r) => r.bulls === BR_SECRET_LEN)) ??
    null;
  const rest = breakers.filter((s) => s !== crackedSeat);
  rest.sort(
    (a, b) =>
      brBestGuess(state, b) - brBestGuess(state, a) || brGuessesOf(state, a) - brGuessesOf(state, b)
  );
  if (crackedSeat !== null) {
    out.push({ seat: crackedSeat, rank: 1 });
    rest.forEach((s, i) => out.push({ seat: s, rank: i + 2 }));
    out.push({ seat: state.makerSeat, rank: state.seatCount });
  } else {
    out.push({ seat: state.makerSeat, rank: 1 });
    rest.forEach((s, i) => out.push({ seat: s, rank: i + 2 }));
  }
  return out;
}

/**
 * Bot breaker: honest deduction — candidates consistent with the bot's OWN
 * bulls-only feedback history (never reads state.code). Easy: random legal
 * guesses; medium/hard: consistency filter, hard picks the most decisive.
 */
export function brBotGuess(
  state: BrState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): number[] {
  const own = state.rows[String(seat)] ?? [];
  if (tier === 'easy' && own.length === 0) {
    return [7, 3, 9, 1];
  }
  const all: number[][] = [];
  const rec = (prefix: number[]): void => {
    if (prefix.length === BR_SECRET_LEN) {
      all.push(prefix.slice());
      return;
    }
    for (let v = 0; v < BR_DIGITS; v++) rec([...prefix, v]);
  };
  rec([]);
  let candidates = all;
  if (tier !== 'easy') {
    candidates = all.filter((c) => own.every((row) => brScoreGuess(c, row.guess) === row.bulls));
  }
  const pool = candidates.length > 0 ? candidates : all;
  const pick = pool[(pool.length * 7 + own.length * 13) % pool.length];
  return pick;
}

/** Bot maker invents a code (its own player choice — a stable pattern is fine). */
export function brBotCode(): number[] {
  const code: number[] = [];
  for (let i = 0; i < BR_SECRET_LEN; i++) code.push((i * 7 + 4) % BR_DIGITS);
  return code;
}
