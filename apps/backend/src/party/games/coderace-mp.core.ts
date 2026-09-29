/**
 * Code Race MP (T27 3P + F27 4P, ONE core) — PURE core, backend-owned.
 *
 * Mastermind fame, multiplayer: ONE maker invents a hidden 4-peg code (values
 * 1-6, repeats allowed); the OTHER seats race to crack it, one guess per turn
 * in rotation, up to 10 guesses each. Feedback per guess: black = right
 * value+position, white = right value wrong position (standard excess
 * handling). First correct crack = 1st. If the limit passes with no crack:
 * maker 1st, breakers ranked by total blacks (closest code).
 *
 * EMPTY-BOARD: the code is PLAYER-CREATED (the maker types it). Bot breakers
 * deduce honestly from their own feedback only (never reading the code).
 * No word lists, no served content.
 *
 * SECRET: `code` must be stripped from every view while the game runs —
 * the adapter exposes redactFor (see party-adapters) and the service applies
 * it before any state crosses the API.
 */

export const CR_SECRET_LEN = 4;
export const CR_VALUES = 6; // pegs 1..6
export const CR_GUESS_LIMIT = 10;

export interface CrRow {
  guess: number[];
  black: number;
  white: number;
}

export interface CrState {
  phase: 'setting' | 'racing' | 'finished';
  /** Secret code — NEVER crosses the API while phase != finished. */
  code: number[] | null;
  makerSeat: number;
  breakerSeats: number[];
  /** Per-seat guess history. */
  rows: Record<string, CrRow[]>;
  turn: number;
  seatCount: number;
}

export interface CrPlacement {
  seat: number;
  rank: number;
}

export function crInitialState(seatCount: number): CrState {
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

export function crValidCode(code: unknown): string | null {
  if (!Array.isArray(code) || code.length !== CR_SECRET_LEN) return 'The code must be 4 pegs.';
  for (const v of code) {
    if (!Number.isInteger(v) || v < 1 || v > CR_VALUES) return 'Pegs must be values 1-6.';
  }
  return null;
}

export function crValidateMove(state: CrState, seat: number, move: unknown): string | null {
  if (state.phase === 'setting') {
    if (seat !== state.makerSeat) return 'Only the code-maker sets the code.';
    return crValidCode((move as { code?: number[] })?.code);
  }
  if (state.phase === 'racing') {
    if (seat === state.makerSeat) return 'The maker does not guess.';
    if (state.turn !== seat) return 'Not your turn.';
    return crValidCode((move as { guess?: number[] })?.guess);
  }
  return 'This table has finished.';
}

export function crScoreGuess(code: number[], guess: number[]): { black: number; white: number } {
  let black = 0;
  const codeRest: number[] = [];
  const guessRest: number[] = [];
  for (let i = 0; i < CR_SECRET_LEN; i++) {
    if (guess[i] === code[i]) black += 1;
    else {
      codeRest.push(code[i]);
      guessRest.push(guess[i]);
    }
  }
  let white = 0;
  const pool = new Map<number, number>();
  for (const v of codeRest) pool.set(v, (pool.get(v) ?? 0) + 1);
  for (const v of guessRest) {
    const n = pool.get(v) ?? 0;
    if (n > 0) {
      white += 1;
      pool.set(v, n - 1);
    }
  }
  return { black, white };
}

/** Apply: setting phase sets the code; racing phase records a scored guess. */
export function crApplyMove(
  state: CrState,
  seat: number,
  move: { code?: number[]; guess?: number[] }
): CrState {
  if (state.phase === 'setting') {
    return {
      ...state,
      phase: 'racing',
      code: (move.code as number[]).slice(),
      turn: state.breakerSeats[0],
    };
  }
  const guess = (move.guess as number[]).slice();
  const { black, white } = crScoreGuess(state.code as number[], guess);
  const key = String(seat);
  const rows = { ...state.rows, [key]: [...(state.rows[key] ?? []), { guess, black, white }] };
  const next = { ...state, rows, turn: nextBreaker(state, seat) };
  // Terminal states reveal the code (redactFor passes it through once phase=finished).
  if (crIsOver(next)) next.phase = 'finished';
  return next;
}

function nextBreaker(state: CrState, seat: number): number {
  const idx = state.breakerSeats.indexOf(seat);
  return state.breakerSeats[(idx + 1) % state.breakerSeats.length];
}

function blacksOf(state: CrState, seat: number): number {
  return (state.rows[String(seat)] ?? []).reduce((a, r) => a + r.black, 0);
}

function guessesOf(state: CrState, seat: number): number {
  return (state.rows[String(seat)] ?? []).length;
}

export function crIsOver(state: CrState): boolean {
  if (state.phase === 'setting') return false;
  if (state.phase === 'finished') return true;
  // finished when someone cracked or every breaker exhausted the limit
  const cracked = state.breakerSeats.some((s) =>
    (state.rows[String(s)] ?? []).some((r) => r.black === CR_SECRET_LEN)
  );
  if (cracked) return true;
  return state.breakerSeats.every((s) => guessesOf(state, s) >= CR_GUESS_LIMIT);
}

/**
 * Placement: first crack = 1st, other breakers by (blacks desc, guesses asc),
 * maker last. No crack at the limit: maker 1st, breakers by blacks desc.
 */
export function crPlacement(state: CrState): CrPlacement[] {
  const out: CrPlacement[] = [];
  const breakers = state.breakerSeats.slice();
  const crackedSeat =
    breakers.find((s) => (state.rows[String(s)] ?? []).some((r) => r.black === CR_SECRET_LEN)) ??
    null;
  const rest = breakers.filter((s) => s !== crackedSeat);
  rest.sort(
    (a, b) => blacksOf(state, b) - blacksOf(state, a) || guessesOf(state, a) - guessesOf(state, b)
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
 * feedback history (never reads state.code). Easy: random legal guesses;
 * medium: consistency filter; hard: consistency + most-informative pick.
 */
export function crBotGuess(
  state: CrState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): number[] {
  const own = state.rows[String(seat)] ?? [];
  const all: number[][] = [];
  const rec = (prefix: number[]): void => {
    if (prefix.length === CR_SECRET_LEN) {
      all.push(prefix.slice());
      return;
    }
    for (let v = 1; v <= CR_VALUES; v++) rec([...prefix, v]);
  };
  rec([]);

  let candidates = all;
  if (tier !== 'easy') {
    candidates = all.filter((c) =>
      own.every((row) => {
        const s = crScoreGuess(c, row.guess);
        return s.black === row.black && s.white === row.white;
      })
    );
  }
  const pool = candidates.length > 0 ? candidates : all;
  const pick = tier === 'hard' ? pool[0] : pool[(pool.length * 7 + own.length * 13) % pool.length];
  return pick;
}

/** Bot maker invents a code (its own player choice — random is fine). */
export function crBotCode(): number[] {
  const code: number[] = [];
  for (let i = 0; i < CR_SECRET_LEN; i++) code.push(1 + ((i * 5 + 3) % CR_VALUES));
  return code;
}
