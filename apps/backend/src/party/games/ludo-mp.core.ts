/**
 * Ludo MP (T41 3P + F9 4P, ONE core) — PURE core, backend-owned.
 *
 * The classic race, streamlined for quick multiplayer tables (documented
 * house rules): 2 tokens per seat, a 52-cell shared ring + a 5-step home
 * column per seat, server-rolled die (approved RNG precedent), a 6 deploys
 * a token from the yard, landing on an enemy token sends it back to the
 * yard, a 6 / capture / finished token grants another roll. First seat with
 * BOTH tokens home is 1st; remaining seats rank by total progress.
 *
 * Token position model (per token): dist = -1 (yard) | 0..56 (progress; ring
 * cell = (startOffset[seat] + dist - 1) mod 52 while dist <= 51; 52..55 =
 * home column; 56 = home/done).
 */

export const LUDO_SEATS_MAX = 4;
export const LUDO_TOKENS = 2;
export const LUDO_RING = 52;
export const LUDO_HOME_STEPS = 5;
export const LUDO_DONE = 56; // 51 ring + 5 home => dist 56 = finished

/** Seat s enters the ring at cell (s * 13). */
export function ludoStartCell(seat: number): number {
  return (seat * 13) % LUDO_RING;
}

export interface LudoState {
  /** dist per token, flattened seat-major: [s0t0, s0t1, s1t0, s1t1, ...] */
  dist: number[];
  turn: number;
  seatCount: number;
  lastRoll: number | null;
  finished: number[];
}

export function ludoInitialState(seatCount: number): LudoState {
  return {
    dist: Array<number>(seatCount * LUDO_TOKENS).fill(-1),
    turn: 0,
    seatCount,
    lastRoll: null,
    finished: [],
  };
}

export function ludoTokensHome(state: LudoState, seat: number): number {
  let n = 0;
  for (let t = 0; t < LUDO_TOKENS; t++) {
    if (state.dist[seat * LUDO_TOKENS + t] === LUDO_DONE) n += 1;
  }
  return n;
}

export function ludoIsOver(state: LudoState): boolean {
  return state.finished.length > 0;
}

export function ludoWinner(state: LudoState): number | null {
  return state.finished.length > 0 ? state.finished[0] : null;
}

/** Progress metric for ranking non-finishers: sum of token dist (yard = 0). */
export function ludoProgress(state: LudoState, seat: number): number {
  let sum = 0;
  for (let t = 0; t < LUDO_TOKENS; t++) {
    const d = state.dist[seat * LUDO_TOKENS + t];
    sum += d < 0 ? 0 : d;
  }
  return sum;
}

export interface LudoPlacement {
  seat: number;
  rank: number;
}

export function ludoPlacement(state: LudoState): LudoPlacement[] {
  const out: LudoPlacement[] = [];
  if (state.finished.length > 0) out.push({ seat: state.finished[0], rank: 1 });
  const rest: number[] = [];
  for (let s = 0; s < state.seatCount; s++) {
    if (!state.finished.includes(s)) rest.push(s);
  }
  rest.sort((a, b) => ludoProgress(state, b) - ludoProgress(state, a) || a - b);
  const base = state.finished.length > 0 ? 2 : 1;
  rest.forEach((s, i) => out.push({ seat: s, rank: base + i }));
  return out;
}

/** Legal token indexes the seat may move given the roll. */
export function ludoLegalTokens(state: LudoState, seat: number, roll: number): number[] {
  const out: number[] = [];
  for (let t = 0; t < LUDO_TOKENS; t++) {
    const idx = seat * LUDO_TOKENS + t;
    const d = state.dist[idx];
    if (d === LUDO_DONE) continue;
    if (d === -1) {
      if (roll === 6) out.push(t);
      continue;
    }
    // movement always legal (overshoot bounces at the done line)
    out.push(t);
  }
  return out;
}

/** Ring cell for a token at ring progress dist (1..51), else null. */
export function ludoRingCell(seat: number, dist: number): number | null {
  if (dist < 1 || dist > 51) return null;
  return (ludoStartCell(seat) + dist - 1) % LUDO_RING;
}

/**
 * Apply a roll + token choice. Returns next state + flags for the UI/engine.
 * Extra roll (same seat again) on: rolled 6, a capture, or a token finished.
 */
export function ludoApplyMove(
  state: LudoState,
  seat: number,
  roll: number,
  token: number
): { state: LudoState; captured: boolean; finishedToken: boolean } {
  const dist = state.dist.slice();
  const idx = seat * LUDO_TOKENS + token;
  let d = dist[idx];
  let captured = false;
  let finishedToken = false;

  if (d === -1) {
    // deploy: dist 1 (only on a 6 — validated by ludoLegalTokens)
    d = 1;
  } else {
    d = d + roll;
    if (d > LUDO_DONE) d = LUDO_DONE - (d - LUDO_DONE); // bounce at the done line
  }
  dist[idx] = d;

  // capture check (only on the shared ring)
  const ring = ludoRingCell(seat, d);
  if (ring !== null) {
    for (let s = 0; s < state.seatCount; s++) {
      if (s === seat) continue;
      for (let t = 0; t < LUDO_TOKENS; t++) {
        const oIdx = s * LUDO_TOKENS + t;
        const od = dist[oIdx];
        if (od >= 1 && od <= 51 && ludoRingCell(s, od) === ring) {
          dist[oIdx] = -1;
          captured = true;
        }
      }
    }
  }
  if (d === LUDO_DONE) finishedToken = true;

  const seatDone = ludoTokensHome({ ...state, dist }, seat) === LUDO_TOKENS;
  const finished = seatDone ? [...state.finished, seat] : state.finished;
  const over = finished.length > 0;
  const nextTurn =
    over || captured || roll === 6 || finishedToken ? seat : (seat + 1) % state.seatCount;

  return {
    state: {
      dist,
      turn: over ? seat : nextTurn,
      seatCount: state.seatCount,
      lastRoll: roll,
      finished,
    },
    captured,
    finishedToken,
  };
}

/** Bot token choice: capture > finish > deploy > furthest. */
export function ludoBotToken(
  state: LudoState,
  seat: number,
  roll: number,
  tier: 'easy' | 'medium' | 'hard'
): number {
  const legal = ludoLegalTokens(state, seat, roll);
  if (legal.length === 0) return -1;
  if (tier === 'easy' && legal.length % 2 === 0) return legal[(legal.length + roll) % legal.length];

  let best = legal[0];
  let bestScore = -1;
  for (const t of legal) {
    const sim = ludoApplyMove(state, seat, roll, t);
    let score = 0;
    if (sim.captured) score += 10;
    if (sim.finishedToken) score += 8;
    if (state.dist[seat * LUDO_TOKENS + t] === -1) score += 4; // deploy
    score += ludoProgress(sim.state, seat) - ludoProgress(state, seat);
    if (tier === 'hard' && sim.state.finished.length > 0) score += 50;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/** Complete one full bot roll cycle: roll + choose + apply. */
export function ludoBotTurn(
  state: LudoState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard',
  rng: () => number
): { state: LudoState; roll: number } {
  const roll = snlLikeRoll(rng);
  const token = ludoBotToken(state, seat, roll, tier);
  if (token < 0)
    return { state: { ...state, lastRoll: roll, turn: (seat + 1) % state.seatCount }, roll };
  const { state: next } = ludoApplyMove(state, seat, roll, token);
  return { state: next, roll };
}

function snlLikeRoll(rng: () => number): number {
  return 1 + Math.floor(rng() * 6);
}
