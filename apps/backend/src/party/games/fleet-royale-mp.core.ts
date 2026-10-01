/**
 * Fleet Royale MP (T29 3P + F29 4P, ONE core) — PURE core, backend-owned.
 *
 * Three or four fleets, ONE shared sea: every seat secretly lays a small
 * fleet (sizes 3-2-2 straight), then shots rotate around the table. A shot
 * is public forever: miss, or hit — and a cell can host segments of several
 * overlapping fleets, so one good shot can wound more than one captain.
 * Losing all your segments puts your fleet out (revealed); the last fleet
 * afloat wins.
 *
 * EMPTY-BOARD: a pure board game, no content. The shared sea is 8x8 — the
 * family's two-player battleship size.
 *
 * SECRET: a live captain's fleet never crosses the API except to its owner
 * (redactFor); eliminated fleets are revealed, and so is everything at the
 * end.
 */

export const FR_ROWS = 8;
export const FR_COLS = 8;
export const FR_SHIP_SIZES = [3, 2, 2] as const;
export const FR_SEGMENTS = FR_SHIP_SIZES.reduce((a, b) => a + b, 0); // 7

export interface FrShip {
  cells: number[];
}

export interface FrState {
  phase: 'placing' | 'battle' | 'finished';
  /** Per seat; null while that seat has not laid a fleet. SECRET until out. */
  fleets: (FrShip[] | null)[];
  /** Per seat: the cell indexes of that player's ships that were hit. */
  hitsBySeat: number[][];
  /** Shared sea: 0 none | 1 miss | 2 hit (public). */
  fired: number[];
  alive: number[];
  /** Elimination order, first out first (their fleet is then revealed). */
  eliminated: number[];
  turn: number;
  seatCount: number;
  winnerSeat: number | null;
  /** Derived in redactFor: remaining un-hit segments per seat (public). */
  segmentsLeft?: number[];
}

export interface FrPlacement {
  seat: number;
  rank: number;
}

export function frInitialState(seatCount: number): FrState {
  return {
    phase: 'placing',
    fleets: Array.from({ length: seatCount }, () => null),
    hitsBySeat: Array.from({ length: seatCount }, () => []),
    fired: Array.from({ length: FR_ROWS * FR_COLS }, () => 0),
    alive: Array.from({ length: seatCount }, (_, i) => i),
    eliminated: [],
    turn: 0,
    seatCount,
    winnerSeat: null,
  };
}

export function frCellIndex(r: number, c: number): number {
  return r * FR_COLS + c;
}

/** Straight + in-bounds + exactly sizes 3/2/2 + no self-overlap. */
export function frValidFleet(fleet: unknown): string | null {
  if (!Array.isArray(fleet) || fleet.length !== FR_SHIP_SIZES.length) {
    return 'A fleet is exactly three ships (3, 2, 2).';
  }
  const seen = new Set<number>();
  for (let s = 0; s < fleet.length; s++) {
    const ship = fleet[s] as FrShip | null;
    const size = FR_SHIP_SIZES[s];
    if (!ship || !Array.isArray(ship.cells) || ship.cells.length !== size) {
      return `Ship ${s + 1} must be ${size} cells.`;
    }
    for (const cell of ship.cells) {
      if (!Number.isInteger(cell) || cell < 0 || cell >= FR_ROWS * FR_COLS) {
        return 'Ships must stay on the sea.';
      }
      if (seen.has(cell)) return 'Ships cannot overlap each other.';
      seen.add(cell);
    }
    // straight line check
    const rs = ship.cells.map((x) => Math.floor(x / FR_COLS));
    const cs = ship.cells.map((x) => x % FR_COLS);
    const sameRow = rs.every((v) => v === rs[0]);
    const sameCol = cs.every((v) => v === cs[0]);
    if (!sameRow && !sameCol) return 'Ships must be straight lines.';
    const sorted = (sameRow ? cs : rs).slice().sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) return 'Ships must be unbroken lines.';
    }
  }
  return null;
}

export function frValidateMove(state: FrState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  const m = move as { fleet?: unknown; shot?: unknown } | null;
  if (state.phase === 'placing') {
    if (state.fleets[seat] !== null) return 'You already laid your fleet.';
    return frValidFleet(m?.fleet);
  }
  // battle
  if (state.turn !== seat) return 'Not your turn.';
  if (!m || !Number.isInteger(m.shot)) return 'Send { shot: cell }.';
  const shot = m.shot as number;
  if (shot < 0 || shot >= FR_ROWS * FR_COLS) return 'That shot is off the sea.';
  if (state.fired[shot] !== 0) return 'That cell was already fired at.';
  const own = state.fleets[seat];
  if (own && own.some((ship) => ship.cells.includes(shot))) {
    return 'Those are your own waters — pick an enemy cell.';
  }
  return null;
}

export function frApplyMove(
  state: FrState,
  seat: number,
  move: { fleet?: FrShip[]; shot?: number }
): FrState {
  if (state.phase === 'placing') {
    const fleets = state.fleets.slice();
    fleets[seat] = (move.fleet as FrShip[]).map((ship) => ({ cells: ship.cells.slice() }));
    if (fleets.every((f) => f !== null)) {
      return { ...state, fleets, phase: 'battle', turn: 0 };
    }
    // Placement is a relay, not a turn power (same shape as Hangman Relay):
    // the engine moves to the next seat that still owes a fleet.
    return { ...state, fleets, turn: frNextPlacer({ ...state, fleets }, seat) };
  }
  const shot = move.shot as number;
  const fired = state.fired.slice();
  const hitsBySeat = state.hitsBySeat.map((h) => h.slice());
  const alive = state.alive.slice();
  const eliminated = state.eliminated.slice();
  let winner: number | null = null;
  let hitAny = false;
  for (const s of alive) {
    const fleet = state.fleets[s];
    if (!fleet) continue;
    if (fleet.some((ship) => ship.cells.includes(shot))) {
      hitAny = true;
      if (!hitsBySeat[s].includes(shot)) hitsBySeat[s].push(shot);
    }
  }
  fired[shot] = hitAny ? 2 : 1;
  for (const s of alive.slice()) {
    if (hitsBySeat[s].length >= FR_SEGMENTS) {
      const idx = alive.indexOf(s);
      alive.splice(idx, 1);
      eliminated.push(s);
    }
  }
  let turn = state.turn;
  let phase: FrState['phase'] = 'battle';
  if (alive.length <= 1) {
    phase = 'finished';
    winner = alive.length === 1 ? alive[0] : null;
  } else {
    turn = frNextAlive(alive, seat);
  }
  return { ...state, fired, hitsBySeat, alive, eliminated, turn, phase, winnerSeat: winner };
}

function frNextAlive(alive: number[], afterSeat: number): number {
  const sorted = alive.slice().sort((a, b) => a - b);
  for (const s of sorted) if (s > afterSeat) return s;
  return sorted[0];
}

function frNextPlacer(state: FrState, afterSeat: number): number {
  for (let k = 1; k <= state.seatCount; k++) {
    const s = (afterSeat + k) % state.seatCount;
    if (state.fleets[s] === null) return s;
  }
  return afterSeat;
}

export function frIsOver(state: FrState): boolean {
  return state.phase === 'finished';
}

export function frWinner(state: FrState): number | null {
  return state.winnerSeat;
}

/** Placement: the survivor 1st, then eliminations in reverse (last out = 2nd). */
export function frPlacement(state: FrState): FrPlacement[] {
  const out: FrPlacement[] = [];
  if (state.winnerSeat !== null) out.push({ seat: state.winnerSeat, rank: 1 });
  const rev = state.eliminated.slice().reverse();
  rev.forEach((seat, i) => out.push({ seat, rank: (state.winnerSeat !== null ? 1 : 0) + i + 1 }));
  return out;
}

/**
 * Bot: laying is deterministic per seat; firing hunts around any public hit
 * (hardest first), never its own waters, and picks by hash so replays are
 * stable. easy sprays anywhere open.
 */
export function frBotMove(state: FrState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  if (state.phase === 'placing') {
    const sizes = FR_SHIP_SIZES;
    const ships: FrShip[] = [];
    for (let k = 0; k < sizes.length; k++) {
      const size = sizes[k];
      const r = (seat * 3 + k) % FR_ROWS;
      const c = (seat + k * 3) % (FR_COLS - size + 1);
      const cells: number[] = [];
      for (let i = 0; i < size; i++) cells.push(frCellIndex(r, c + i));
      ships.push({ cells });
    }
    return { fleet: ships };
  }
  const own = state.fleets[seat];
  const ownSet = new Set<number>();
  if (own) own.forEach((ship) => ship.cells.forEach((x) => ownSet.add(x)));
  const openCells: number[] = [];
  for (let i = 0; i < state.fired.length; i++) {
    if (state.fired[i] === 0 && !ownSet.has(i)) openCells.push(i);
  }
  if (openCells.length === 0) {
    // corner case: every open cell is own waters — fire anywhere unfired
    for (let i = 0; i < state.fired.length; i++) if (state.fired[i] === 0) openCells.push(i);
  }
  let candidates = openCells;
  if (tier !== 'easy') {
    const hunt: number[] = [];
    for (const cell of openCells) {
      const r = Math.floor(cell / FR_COLS);
      const c = cell % FR_COLS;
      const around = [
        r > 0 ? frCellIndex(r - 1, c) : -1,
        r < FR_ROWS - 1 ? frCellIndex(r + 1, c) : -1,
        c > 0 ? frCellIndex(r, c - 1) : -1,
        c < FR_COLS - 1 ? frCellIndex(r, c + 1) : -1,
      ].filter((x) => x >= 0);
      if (around.some((x) => state.fired[x] === 2)) hunt.push(cell);
    }
    if (hunt.length > 0) candidates = hunt;
  }
  const pick =
    tier === 'hard'
      ? candidates[(seat * 5 + state.eliminated.length * 3 + openCells.length) % candidates.length]
      : candidates[(seat * 13 + state.fired.filter((f) => f !== 0).length) % candidates.length];
  return { shot: pick };
}

/**
 * Redaction: a live captain's fleet stays hidden; hits taken are public only
 * as the shared board markers (plus a remaining-segments count). Eliminated
 * fleets reveal, and the finished table reveals everything.
 */
export function frRedactFor(state: FrState, seat: number | null): FrState {
  const segmentsLeft = state.hitsBySeat.map((h) => Math.max(0, FR_SEGMENTS - h.length));
  if (state.phase === 'finished') return { ...state, segmentsLeft };
  const fleets = state.fleets.map((f, i) => {
    if (f === null) return null;
    if (seat !== null && i === seat) return f;
    if (state.eliminated.includes(i)) return f;
    return null;
  });
  const hitsBySeat = state.hitsBySeat.map((h, i) => (seat !== null && i === seat ? h : []));
  return { ...state, fleets, hitsBySeat, segmentsLeft };
}
