/**
 * Quadwall MP (T20 3P + F17 4P, ONE core) — PURE core, backend-owned.
 *
 * Multiplayer Quoridor on the classic 9x9 grid: every seat races its pawn
 * to the opposite edge, dropping two-cell walls to slow the others. Three
 * seats get 6 walls each ("Quoridor-3"), four seats get 5 ("Quadwall").
 * A wall may never make anyone's goal unreachable (BFS trap check).
 * First pawn home wins.
 *
 * EMPTY-BOARD: pure board game — no words, no served content, all public.
 */

export const QU_N = 9;

export interface QuState {
  /** Pawn positions [r, c] per seat. */
  pawns: number[][];
  /** hw[r*8+c] = horizontal wall below row r spanning columns c..c+1. */
  hw: boolean[];
  /** vw[r*8+c] = vertical wall right of column c spanning rows r..r+1. */
  vw: boolean[];
  /** Walls left per seat. */
  left: number[];
  lastMove:
    | { kind: 'pawn'; seat: number; to: number[] }
    | { kind: 'wall'; seat: number; o: 'h' | 'v'; r: number; c: number }
    | null;
  turn: number;
  seatCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
  moveCount: number;
}
export interface QuPlacement {
  seat: number;
  rank: number;
}

/** Goal codes: 0 = top row, 1 = bottom row, 2 = right column, 3 = left column. */
export const QU_GOALS: number[][] = [
  [0, 1, 2],
  [0, 1, 2, 3],
];

const QU_STARTS: number[][][] = [
  [
    [8, 4],
    [0, 4],
    [4, 0],
  ],
  [
    [8, 4],
    [0, 4],
    [4, 0],
    [4, 8],
  ],
];

function quGoal(seatCount: number, seat: number): number {
  const row = seatCount >= 4 ? QU_GOALS[1] : QU_GOALS[0];
  return row[seat] ?? 2;
}

function quStart(seatCount: number, seat: number): number[] {
  const row = seatCount >= 4 ? QU_STARTS[1] : QU_STARTS[0];
  const p = row[seat] ?? [4, 4];
  return [p[0], p[1]];
}

export function quInitialState(seatCount: number): QuState {
  const n = seatCount >= 4 ? 4 : 3;
  const walls = n >= 4 ? 5 : 6;
  return {
    pawns: Array.from({ length: seatCount }, (_, s) => quStart(seatCount, s)),
    hw: new Array(64).fill(false) as boolean[],
    vw: new Array(64).fill(false) as boolean[],
    left: new Array(seatCount).fill(walls) as number[],
    lastMove: null,
    turn: 0,
    seatCount,
    phase: 'playing',
    winnerSeat: null,
    moveCount: 0,
  };
}

/* ------------------------------ movement ------------------------------ */

/** Wall blocking vertical movement across boundary row rb (1..8) at col c. */
function quHBlocks(hw: boolean[], rb: number, c: number): boolean {
  const r = rb - 1;
  if (c <= 7 && hw[r * 8 + c]) return true;
  if (c >= 1 && hw[r * 8 + c - 1]) return true;
  return false;
}
/** Wall blocking horizontal movement across boundary col cb (1..8) at row r. */
function quVBlocks(vw: boolean[], r: number, cb: number): boolean {
  const c = cb - 1;
  if (r <= 7 && vw[r * 8 + c]) return true;
  if (r >= 1 && vw[(r - 1) * 8 + c]) return true;
  return false;
}

function quAt(pawns: number[][], r: number, c: number): number {
  for (let i = 0; i < pawns.length; i++) {
    if (pawns[i][0] === r && pawns[i][1] === c) return i;
  }
  return -1;
}

/** Legal pawn destinations [r,c] for a seat (straight moves + jumps). */
export function quPawnDests(state: QuState, seat: number): number[][] {
  const [r, c] = state.pawns[seat];
  const out: number[][] = [];
  const dirs: number[][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  for (const [dr, dc] of dirs) {
    const tr = r + dr;
    const tc = c + dc;
    if (tr < 0 || tr >= QU_N || tc < 0 || tc >= QU_N) continue;
    const blocked =
      dr === -1
        ? quHBlocks(state.hw, r, c)
        : dr === 1
          ? quHBlocks(state.hw, r + 1, c)
          : dc === -1
            ? quVBlocks(state.vw, r, c)
            : quVBlocks(state.vw, r, c + 1);
    if (blocked) continue;
    if (quAt(state.pawns, tr, tc) < 0) {
      out.push([tr, tc]);
      continue;
    }
    // Adjacent pawn: try the straight jump first.
    const br = tr + dr;
    const bc = tc + dc;
    let jumped = false;
    if (br >= 0 && br < QU_N && bc >= 0 && bc < QU_N && quAt(state.pawns, br, bc) < 0) {
      const bBlocked =
        dr === -1
          ? quHBlocks(state.hw, tr, tc)
          : dr === 1
            ? quHBlocks(state.hw, tr + 1, tc)
            : dc === -1
              ? quVBlocks(state.vw, tr, tc)
              : quVBlocks(state.vw, tr, tc + 1);
      if (!bBlocked) {
        out.push([br, bc]);
        jumped = true;
      }
    }
    if (!jumped) {
      // Diagonal hops beside the adjacent pawn.
      const sides: number[][] =
        dr === 0
          ? [
              [1, 0],
              [-1, 0],
            ]
          : [
              [0, 1],
              [0, -1],
            ];
      for (const [sr, sc] of sides) {
        const lr = tr + sr;
        const lc = tc + sc;
        if (lr < 0 || lr >= QU_N || lc < 0 || lc >= QU_N) continue;
        if (quAt(state.pawns, lr, lc) >= 0) continue;
        out.push([lr, lc]);
      }
    }
  }
  return out;
}

/* ------------------------------ walls ------------------------------ */

/** Can slot (o, r, c) take a wall? Occupancy + crossing only. */
function quWallFree(state: QuState, o: 'h' | 'v', r: number, c: number): boolean {
  if (r < 0 || r > 7 || c < 0 || c > 7) return false;
  const i = r * 8 + c;
  if (o === 'h') {
    if (state.hw[i]) return false;
    if (c + 1 <= 7 && state.hw[i + 1]) return false;
    if (c - 1 >= 0 && state.hw[i - 1]) return false;
    if (state.vw[i]) return false; // proper crossing
    return true;
  }
  if (state.vw[i]) return false;
  if (r + 1 <= 7 && state.vw[i + 8]) return false;
  if (r - 1 >= 0 && state.vw[i - 8]) return false;
  if (state.hw[i]) return false;
  return true;
}

/** With a hypothetical wall applied, is every seat still able to reach its goal? */
function quNoTraps(state: QuState, o: 'h' | 'v', r: number, c: number): boolean {
  const hw = state.hw.slice();
  const vw = state.vw.slice();
  if (o === 'h') hw[r * 8 + c] = true;
  else vw[r * 8 + c] = true;
  for (let s = 0; s < state.seatCount; s++) {
    if (
      quDistToGoal(
        state.pawns,
        hw,
        vw,
        state.pawns[s][0],
        state.pawns[s][1],
        quGoal(state.seatCount, s)
      ) === Infinity
    ) {
      return false;
    }
  }
  return true;
}

export function quBuildDist(
  pawns: number[][],
  hw: boolean[],
  vw: boolean[],
  r0: number,
  c0: number,
  goal: number
): number {
  const dist = new Array(QU_N * QU_N).fill(-1) as number[];
  const q: number[] = [r0 * QU_N + c0];
  dist[r0 * QU_N + c0] = 0;
  let head = 0;
  while (head < q.length) {
    const cur = q[head++];
    const r = Math.floor(cur / QU_N);
    const c = cur % QU_N;
    const d = dist[cur];
    if (
      (goal === 0 && r === 0) ||
      (goal === 1 && r === QU_N - 1) ||
      (goal === 2 && c === QU_N - 1) ||
      (goal === 3 && c === 0)
    ) {
      return d;
    }
    const nbrs: number[][] = [];
    if (r > 0 && !quHBlocks(hw, r, c)) nbrs.push([r - 1, c]);
    if (r < QU_N - 1 && !quHBlocks(hw, r + 1, c)) nbrs.push([r + 1, c]);
    if (c > 0 && !quVBlocks(vw, r, c)) nbrs.push([r, c - 1]);
    if (c < QU_N - 1 && !quVBlocks(vw, r, c + 1)) nbrs.push([r, c + 1]);
    for (const [nr, nc] of nbrs) {
      const ni = nr * QU_N + nc;
      if (dist[ni] === -1) {
        dist[ni] = d + 1;
        q.push(ni);
      }
    }
  }
  return Infinity;
}

function quDistToGoal(
  pawns: number[][],
  hw: boolean[],
  vw: boolean[],
  r0: number,
  c0: number,
  goal: number
): number {
  return quBuildDist(pawns, hw, vw, r0, c0, goal);
}

/* ------------------------------ game flow ------------------------------ */

export function quValidateMove(state: QuState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { pawn?: unknown; wall?: unknown; r?: unknown; c?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { pawn } or { wall, r, c }.';
  if (Array.isArray(m.pawn)) {
    const p = m.pawn as unknown[];
    if (p.length !== 2 || !Number.isInteger(p[0]) || !Number.isInteger(p[1]))
      return 'Send { pawn: [r, c] }.';
    const [r, c] = p as number[];
    const dests = quPawnDests(state, seat);
    if (!dests.some((d) => d[0] === r && d[1] === c)) return 'Your pawn cannot go there.';
    return null;
  }
  if (m.wall === 'h' || m.wall === 'v') {
    if (!Number.isInteger(m.r) || !Number.isInteger(m.c)) return 'Send { wall, r, c }.';
    const r = m.r as number;
    const c = m.c as number;
    if (state.left[seat] <= 0) return 'You are out of walls.';
    if (!quWallFree(state, m.wall, r, c)) return 'A wall already runs through there.';
    if (!quNoTraps(state, m.wall, r, c))
      return 'That wall would trap a pawn — walls may slow, never seal.';
    return null;
  }
  return 'Send { pawn } or { wall, r, c }.';
}

export function quApplyMove(state: QuState, seat: number, move: unknown): QuState {
  const m = move as { pawn?: number[]; wall?: 'h' | 'v'; r?: number; c?: number };
  const next: QuState = {
    ...state,
    pawns: state.pawns.map((p) => p.slice()),
    hw: state.hw.slice(),
    vw: state.vw.slice(),
    left: state.left.slice(),
  };
  if (Array.isArray(m.pawn)) {
    next.pawns[seat] = [m.pawn[0], m.pawn[1]];
    next.lastMove = { kind: 'pawn', seat, to: [m.pawn[0], m.pawn[1]] };
    if (quReached(state.seatCount, seat, m.pawn[0], m.pawn[1])) {
      next.phase = 'finished';
      next.winnerSeat = seat;
    }
  } else if (m.wall === 'h' || m.wall === 'v') {
    const r = m.r as number;
    const c = m.c as number;
    if (m.wall === 'h') next.hw[r * 8 + c] = true;
    else next.vw[r * 8 + c] = true;
    next.left[seat] -= 1;
    next.lastMove = { kind: 'wall', seat, o: m.wall, r, c };
  }
  next.moveCount = state.moveCount + 1;
  next.turn = (seat + 1) % state.seatCount;
  return next;
}

function quReached(seatCount: number, seat: number, r: number, c: number): boolean {
  const g = quGoal(seatCount, seat);
  if (g === 0) return r === 0;
  if (g === 1) return r === QU_N - 1;
  if (g === 2) return c === QU_N - 1;
  return c === 0;
}

export function quIsOver(state: QuState): boolean {
  return state.phase === 'finished';
}

export function quWinner(state: QuState): number | null {
  return state.winnerSeat;
}

export function quPlacement(state: QuState): QuPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, seat) => {
    const dist =
      state.phase === 'finished' && state.winnerSeat === seat
        ? 0
        : quDistToGoal(
            state.pawns,
            state.hw,
            state.vw,
            state.pawns[seat][0],
            state.pawns[seat][1],
            quGoal(state.seatCount, seat)
          );
    return { seat, dist: dist === Infinity ? 999 : dist };
  });
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return x.dist - y.dist || x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

function quOppBest(state: QuState, seat: number): number {
  let best = Infinity;
  for (let s = 0; s < state.seatCount; s++) {
    if (s === seat) continue;
    const d = quDistToGoal(
      state.pawns,
      state.hw,
      state.vw,
      state.pawns[s][0],
      state.pawns[s][1],
      quGoal(state.seatCount, s)
    );
    if (d < best) best = d;
  }
  return best;
}

export function quBotMove(state: QuState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const myGoal = quGoal(state.seatCount, seat);
  const myDist = quDistToGoal(
    state.pawns,
    state.hw,
    state.vw,
    state.pawns[seat][0],
    state.pawns[seat][1],
    myGoal
  );
  const dests = quPawnDests(state, seat);
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  // Best pawn move by resulting own distance.
  let bestDest: number[] | null = null;
  let bestDestDist = Infinity;
  for (const d of dests) {
    const dist = quDistToGoal(state.pawns, state.hw, state.vw, d[0], d[1], myGoal);
    if (dist < bestDestDist) {
      bestDestDist = dist;
      bestDest = d;
    }
  }
  const pawnAction = bestDest ? { pawn: [bestDest[0], bestDest[1]] } : null;
  if (tier === 'easy' || state.left[seat] <= 0) {
    if (pawnAction) return pawnAction;
    if (dests.length) return { pawn: [dests[0][0], dests[0][1]] };
    return { wall: 'h', r: 0, c: 0 }; // defensive; trap rule makes this unreachable
  }

  // Wall candidates: block the leading opponent's current shortest path.
  let leader = -1;
  let leaderDist = Infinity;
  for (let s = 0; s < state.seatCount; s++) {
    if (s === seat) continue;
    const d = quDistToGoal(
      state.pawns,
      state.hw,
      state.vw,
      state.pawns[s][0],
      state.pawns[s][1],
      quGoal(state.seatCount, s)
    );
    if (d < leaderDist) {
      leaderDist = d;
      leader = s;
    }
  }
  const cap = tier === 'hard' ? 34 : 16;
  const candidates: Array<{ o: 'h' | 'v'; r: number; c: number }> = [];
  if (leader >= 0 && leaderDist < Infinity) {
    // Trace the leader's shortest path.
    const goal = quGoal(state.seatCount, leader);
    const dist = new Array(QU_N * QU_N).fill(-1) as number[];
    const start = state.pawns[leader][0] * QU_N + state.pawns[leader][1];
    dist[start] = 0;
    const q: number[] = [start];
    let head = 0;
    let end = -1;
    while (head < q.length) {
      const cur = q[head++];
      const r = Math.floor(cur / QU_N);
      const c = cur % QU_N;
      if (
        (goal === 0 && r === 0) ||
        (goal === 1 && r === QU_N - 1) ||
        (goal === 2 && c === QU_N - 1) ||
        (goal === 3 && c === 0)
      ) {
        end = cur;
        break;
      }
      const nbrs: number[][] = [];
      if (r > 0 && !quHBlocks(state.hw, r, c)) nbrs.push([r - 1, c]);
      if (r < QU_N - 1 && !quHBlocks(state.hw, r + 1, c)) nbrs.push([r + 1, c]);
      if (c > 0 && !quVBlocks(state.vw, r, c)) nbrs.push([r, c - 1]);
      if (c < QU_N - 1 && !quVBlocks(state.vw, r, c + 1)) nbrs.push([r, c + 1]);
      for (const [nr, nc] of nbrs) {
        const ni = nr * QU_N + nc;
        if (dist[ni] === -1) {
          dist[ni] = dist[cur] + 1;
          q.push(ni);
        }
      }
    }
    if (end >= 0) {
      // Walk back the path.
      const path: number[][] = [];
      let cur = end;
      while (cur !== start) {
        path.push([Math.floor(cur / QU_N), cur % QU_N]);
        const r = Math.floor(cur / QU_N);
        const c = cur % QU_N;
        const d = dist[cur];
        const back: number[][] = [];
        if (r > 0 && !quHBlocks(state.hw, r, c)) back.push([r - 1, c]);
        if (r < QU_N - 1 && !quHBlocks(state.hw, r + 1, c)) back.push([r + 1, c]);
        if (c > 0 && !quVBlocks(state.vw, r, c)) back.push([r, c - 1]);
        if (c < QU_N - 1 && !quVBlocks(state.vw, r, c + 1)) back.push([r, c + 1]);
        let foundNext = false;
        for (const [br, bc] of back) {
          if (dist[br * QU_N + bc] === d - 1) {
            cur = br * QU_N + bc;
            foundNext = true;
            break;
          }
        }
        if (!foundNext) break;
      }
      path.reverse();
      // For each step, propose 2 wall slots crossing it.
      for (let i = 0; i + 1 < path.length && candidates.length < cap; i++) {
        const A = path[i];
        const B = path[i + 1];
        if (B[0] === A[0] + 1) {
          candidates.push({ o: 'h', r: A[0], c: A[1] });
          if (A[1] - 1 >= 0) candidates.push({ o: 'h', r: A[0], c: A[1] - 1 });
        } else if (B[0] === A[0] - 1) {
          candidates.push({ o: 'h', r: B[0], c: A[1] });
          if (A[1] - 1 >= 0) candidates.push({ o: 'h', r: B[0], c: A[1] - 1 });
        } else if (B[1] === A[1] + 1) {
          candidates.push({ o: 'v', r: A[0], c: A[1] });
          if (A[0] - 1 >= 0) candidates.push({ o: 'v', r: A[0] - 1, c: A[1] });
        } else if (B[1] === A[1] - 1) {
          candidates.push({ o: 'v', r: A[0], c: B[1] });
          if (A[0] - 1 >= 0) candidates.push({ o: 'v', r: A[0] - 1, c: B[1] });
        }
      }
    }
  }

  const seen = new Set<string>();
  let bestWall: { o: 'h' | 'v'; r: number; c: number } | null = null;
  let bestWallValue = -Infinity;
  for (const cand of candidates) {
    const key = cand.o + cand.r + '-' + cand.c;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!quWallFree(state, cand.o, cand.r, cand.c)) continue;
    if (!quNoTraps(state, cand.o, cand.r, cand.c)) continue;
    const hw = state.hw.slice();
    const vw = state.vw.slice();
    if (cand.o === 'h') hw[cand.r * 8 + cand.c] = true;
    else vw[cand.r * 8 + cand.c] = true;
    let oppBest = Infinity;
    for (let s = 0; s < state.seatCount; s++) {
      if (s === seat) continue;
      const d = quBuildDist(
        state.pawns,
        hw,
        vw,
        state.pawns[s][0],
        state.pawns[s][1],
        quGoal(state.seatCount, s)
      );
      if (d < oppBest) oppBest = d;
    }
    const value = (oppBest === Infinity ? -1e6 : oppBest) - myDist;
    if (value > bestWallValue) {
      bestWallValue = value;
      bestWall = cand;
    }
  }

  const pawnValue = quOppBest(state, seat) - bestDestDist;
  if (pawnAction && (bestWall === null || pawnValue >= bestWallValue - 1e-9)) return pawnAction;
  if (bestWall) return { wall: bestWall.o, r: bestWall.r, c: bestWall.c };
  if (pawnAction) return pawnAction;
  if (dests.length) return { pawn: [dests[0][0], dests[0][1]] };
  void pick;
  return { wall: 'h', r: 0, c: 0 };
}
