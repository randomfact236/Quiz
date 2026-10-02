/**
 * Abalone-3 MP (T22 3P + F24 4P, ONE core) — PURE core, backend-owned.
 *
 * Sumo on the hex ring: each player starts with a five-marble triangle in
 * a corner of the 61-space board. Move one, two or three of your marbles
 * in a line; push enemy groups strictly smaller than your moving group
 * (sideways moves need clear space). First to eject 4 marbles (3 in the
 * four-player ring) wins.
 *
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export const AB_R = 3;
export const AB_TARGET: Record<number, number> = { 3: 4, 4: 3 };

export interface AbCell {
  q: number;
  r: number;
}
export interface AbState {
  /** 0 empty, else seat + 1. */
  cells: number[];
  /** Ejections counted per seat (a push ejects enemy marbles). */
  ejected: number[];
  turn: number;
  seatCount: number;
  lastMove: {
    seat: number;
    marbles: number[];
    dir: number;
    pushed: number[];
    ejected: number[];
  } | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface AbPlacement {
  seat: number;
  rank: number;
}

export const AB_DIRS: number[][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export function abLayout(): { cells: AbCell[]; idx: (q: number, r: number) => number } {
  const cells: AbCell[] = [];
  const map = new Map<string, number>();
  for (let q = -AB_R; q <= AB_R; q++) {
    for (let r = -AB_R; r <= AB_R; r++) {
      if (Math.abs(q + r) <= AB_R) {
        map.set(q + ',' + r, cells.length);
        cells.push({ q, r });
      }
    }
  }
  return {
    cells,
    idx: (q: number, r: number): number => {
      const v = map.get(q + ',' + r);
      return v === undefined ? -1 : v;
    },
  };
}

function abDist(a: AbCell, b: AbCell): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

const AB_POLES: Record<number, number[][]> = {
  3: [
    [0, -AB_R],
    [-AB_R, AB_R],
    [AB_R, 0],
  ],
  4: [
    [0, -AB_R],
    [-AB_R, AB_R],
    [AB_R, 0],
    [-AB_R, 0],
  ],
};

export function abInitialState(seatCount: number): AbState {
  const L = abLayout();
  const poles = AB_POLES[seatCount >= 4 ? 4 : 3] ?? AB_POLES[4];
  const cells = new Array(L.cells.length).fill(0) as number[];
  const taken = new Set<number>();
  for (let seat = 0; seat < seatCount; seat++) {
    const pole = L.cells[L.idx(poles[seat][0], poles[seat][1])];
    const cands = L.cells
      .map((c, i) => ({ i, d: abDist(c, pole) }))
      .filter((x) => !taken.has(x.i))
      .sort((a, b) => a.d - b.d || a.i - b.i)
      .slice(0, 5);
    for (const c of cands) {
      cells[c.i] = seat + 1;
      taken.add(c.i);
    }
  }
  return {
    cells,
    ejected: new Array(seatCount).fill(0) as number[],
    turn: 0,
    seatCount,
    lastMove: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

function abElastic(v: number): boolean {
  return v !== 0;
}

/** Resolve a candidate move; null = illegal, else the resulting changes. */
export interface AbResolution {
  changes: { idx: number; v: number }[];
  pushed: number[];
  ejected: number[];
  kind: 'step' | 'push' | 'broadside';
}

export function abResolve(
  state: AbState,
  seat: number,
  marbles: number[],
  dir: number
): AbResolution | { err: string } {
  const L = abLayout();
  const me = seat + 1;
  if (!marbles.length || marbles.length > 3) return { err: 'Move one, two or three marbles.' };
  for (const m of marbles) {
    if (m < 0 || m >= L.cells.length) return { err: 'That marble is off the board.' };
    if (state.cells[m] !== me) return { err: 'Pick your own marbles.' };
  }
  const d = AB_DIRS[dir];
  const cells = state.cells;
  if (marbles.length === 1) {
    const from = marbles[0];
    const c = L.cells[from];
    const to = L.idx(c.q + d[0], c.r + d[1]);
    if (to < 0) return { err: 'The edge is right there — no self-ejections.' };
    const v = cells[to];
    if (v === me) return { err: 'A marble is in the way.' };
    if (v === 0) {
      return {
        changes: [
          { idx: to, v: me },
          { idx: from, v: 0 },
        ],
        pushed: [],
        ejected: [],
        kind: 'step',
      };
    }
    // push one enemy marble
    const beyond = L.idx(c.q + d[0] * 2, c.r + d[1] * 2);
    if (beyond >= 0 && cells[beyond] !== 0) return { err: 'They have support — no push.' };
    const ejected = beyond < 0 ? [to] : [];
    const changes = [{ idx: from, v: 0 }];
    if (beyond >= 0) changes.push({ idx: beyond, v });
    changes.push({ idx: to, v: me });
    return { changes, pushed: [to], ejected, kind: 'push' };
  }
  // find the shared line axis
  const m0 = L.cells[marbles[0]];
  let axis = -1;
  let signUsed = 1;
  for (let a = 0; a < 3 && axis < 0; a++) {
    for (const sgn of [1, -1]) {
      const predicted: number[] = [];
      for (let k = 0; k < marbles.length; k++) {
        const ni = L.idx(m0.q + AB_DIRS[a][0] * k * sgn, m0.r + AB_DIRS[a][1] * k * sgn);
        predicted.push(ni);
      }
      if (predicted.every((p) => p >= 0 && marbles.includes(p))) {
        // exact set equality
        if (predicted.length === marbles.length && new Set(marbles).size === marbles.length) {
          axis = a;
          signUsed = sgn;
          break;
        }
      }
    }
  }
  if (axis < 0) return { err: 'Stones must move in a straight line.' };
  const parallel = dir === axis || (dir + 3) % 6 === axis;
  if (parallel) {
    // inline: order marbles along dir, lead first
    const vec = AB_DIRS[dir];
    const ordered = marbles
      .slice()
      .sort((x, y) => abProj(L.cells[y], vec) - abProj(L.cells[x], vec));
    const lead = ordered[0];
    const lc = L.cells[lead];
    const beyond = L.idx(lc.q + vec[0], lc.r + vec[1]);
    if (beyond < 0) return { err: 'The edge is right there — no self-ejections.' };
    const bv = cells[beyond];
    if (bv === me) return { err: 'A marble is in the way.' };
    const changes: { idx: number; v: number }[] = [];
    const pushed: number[] = [];
    const ejected: number[] = [];
    if (bv === 0) {
      // plain shift, tail first so we never clobber
      const tail = ordered.slice().reverse();
      for (const m of tail) {
        const c = L.cells[m];
        const to = L.idx(c.q + vec[0], c.r + vec[1]);
        changes.push({ idx: to, v: me });
        changes.push({ idx: m, v: 0 });
      }
      return { changes, pushed, ejected, kind: 'step' };
    }
    // push: count the enemy group
    const enemy = bv;
    const enemyGroup: number[] = [beyond];
    let cur = beyond;
    for (;;) {
      const cc = L.cells[cur];
      const nb = L.idx(cc.q + vec[0], cc.r + vec[1]);
      if (nb < 0) break;
      if (cells[nb] === enemy) {
        enemyGroup.push(nb);
        cur = nb;
        continue;
      }
      if (cells[nb] === 0) break;
      return { err: 'They have support behind — no push.' };
    }
    if (marbles.length <= enemyGroup.length)
      return { err: 'Theirs is the bigger group — sumo says no.' };
    // shift enemies far-to-near
    const enemyFarFirst = enemyGroup.slice().reverse();
    for (const e of enemyFarFirst) {
      const ec = L.cells[e];
      const to = L.idx(ec.q + vec[0], ec.r + vec[1]);
      if (to < 0) {
        ejected.push(e);
        changes.push({ idx: e, v: 0 });
      } else {
        changes.push({ idx: to, v: enemy });
      }
    }
    // shift my group tail..lead (lead lands on the first enemy cell)
    const tail = ordered.slice().reverse();
    for (const m of tail) {
      const c = L.cells[m];
      const to = L.idx(c.q + vec[0], c.r + vec[1]);
      changes.push({ idx: to, v: me });
      changes.push({ idx: m, v: 0 });
    }
    return { changes, pushed: enemyGroup, ejected, kind: 'push' };
  }
  // broadside: every destination must be empty
  const changes: { idx: number; v: number }[] = [];
  for (const m of marbles) {
    const c = L.cells[m];
    const to = L.idx(c.q + d[0], c.r + d[1]);
    if (to < 0) return { err: 'The edge is right there — no self-ejections.' };
    if (cells[to] !== 0) return { err: 'Sideways slides need clear space.' };
    changes.push({ idx: to, v: me });
  }
  for (const m of marbles) changes.push({ idx: m, v: 0 });
  return { changes, pushed: [], ejected: [], kind: 'broadside' };
}

function abProj(c: AbCell, vec: number[]): number {
  // projection of cell position onto direction vector (relative to origin)
  return c.q * vec[0] + c.r * vec[1] + (c.q + c.r) * (vec[0] + vec[1]);
}

export function abValidateMove(state: AbState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { marbles?: unknown; dir?: unknown } | null;
  if (!m || !Array.isArray(m.marbles) || !Number.isInteger(m.dir)) return 'Send { marbles, dir }.';
  const dir = m.dir as number;
  if (dir < 0 || dir > 5) return 'Direction 0-5 only.';
  const res = abResolve(
    state,
    seat,
    (m.marbles as unknown[]).map((x) => Number(x)),
    dir
  );
  if ('err' in res) return res.err;
  return null;
}

export function abApplyMove(state: AbState, seat: number, move: unknown): AbState {
  const m = move as { marbles: number[]; dir: number };
  const res = abResolve(state, seat, m.marbles, m.dir);
  if ('err' in res) throw new Error('abalone: illegal move in apply (' + res.err + ')');
  const cells = state.cells.slice();
  for (const ch of res.changes) cells[ch.idx] = ch.v;
  const ejected = state.ejected.slice();
  ejected[seat] += res.ejected.length;
  const next: AbState = {
    ...state,
    cells,
    ejected,
    lastMove: {
      seat,
      marbles: m.marbles.slice(),
      dir: m.dir,
      pushed: res.pushed,
      ejected: res.ejected,
    },
    moveCount: state.moveCount + 1,
  };
  const target = AB_TARGET[state.seatCount >= 4 ? 4 : 3] ?? 3;
  if (ejected[seat] >= target) {
    next.phase = 'finished';
    next.winnerSeat = seat;
    return next;
  }
  if (next.moveCount > 300) {
    let best = 0;
    for (let s = 1; s < state.seatCount; s++) {
      if (ejected[s] > ejected[best]) best = s;
    }
    next.phase = 'finished';
    next.winnerSeat = best;
    return next;
  }
  let nxt = (seat + 1) % state.seatCount;
  let found = false;
  for (let i = 0; i < state.seatCount; i++) {
    if (abHasMove(next, nxt)) {
      found = true;
      break;
    }
    nxt = (nxt + 1) % state.seatCount;
  }
  if (!found) {
    // nobody can act — most ejections takes it
    let best = 0;
    for (let s = 1; s < state.seatCount; s++) {
      if (next.ejected[s] > next.ejected[best]) best = s;
    }
    next.phase = 'finished';
    next.winnerSeat = best;
    return next;
  }
  next.turn = nxt;
  return next;
}

/** Any legal move at all for this seat? (used for turn skipping) */
export function abHasMove(state: AbState, seat: number): boolean {
  const L = abLayout();
  const me = seat + 1;
  for (let c = 0; c < state.cells.length; c++) {
    if (state.cells[c] !== me) continue;
    for (let dir = 0; dir < 6; dir++) {
      if (!('err' in abResolve(state, seat, [c], dir))) return true;
    }
    for (let a = 0; a < 3; a++) {
      for (const sgn of [1, -1]) {
        const line: number[] = [c];
        for (let k = 1; k <= 2; k++) {
          const cc = L.cells[c];
          const ni = L.idx(cc.q + AB_DIRS[a][0] * k * sgn, cc.r + AB_DIRS[a][1] * k * sgn);
          if (ni < 0 || state.cells[ni] !== me) break;
          line.push(ni);
          for (let dir = 0; dir < 6; dir++) {
            if (!('err' in abResolve(state, seat, line.slice(), dir))) return true;
          }
        }
      }
    }
  }
  return false;
}

export function abIsOver(state: AbState): boolean {
  return state.phase === 'finished';
}

export function abWinner(state: AbState): number | null {
  return state.winnerSeat;
}

export function abPlacement(state: AbState): AbPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({
    seat,
    n: state.ejected[seat],
  }));
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return y.n - x.n || x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

function abApproach(state: AbState, marbles: number[], dir: number): number {
  const L = abLayout();
  const before = abMinEnemyDist(state, marbles);
  const vec = AB_DIRS[dir];
  const afterCells: number[] = [];
  for (const m of marbles) {
    const c = L.cells[m];
    const ni = L.idx(c.q + vec[0], c.r + vec[1]);
    if (ni < 0) return 0;
    afterCells.push(ni);
  }
  const after = abMinEnemyDist(state, afterCells);
  if (before === Infinity || after === Infinity) return 0;
  return before - after;
}

function abMinEnemyDist(state: AbState, cells: number[]): number {
  const L = abLayout();
  const me = state.cells[cells[0]] || -99;
  let best = Infinity;
  for (const m of cells) {
    for (let e = 0; e < state.cells.length; e++) {
      const v = state.cells[e];
      if (v === 0 || v === me) continue;
      best = Math.min(best, abDist(L.cells[m], L.cells[e]));
    }
  }
  return best;
}

export function abBotMove(state: AbState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  const L = abLayout();
  const me = seat + 1;
  const seen = new Set<string>();
  const cands: Array<{ marbles: number[]; dir: number; score: number }> = [];
  for (let c = 0; c < state.cells.length; c++) {
    if (state.cells[c] !== me) continue;
    // single steps
    for (let dir = 0; dir < 6; dir++) {
      const res = abResolve(state, seat, [c], dir);
      if ('err' in res) continue;
      seen.add(c + '|' + dir);
      let score = res.kind === 'push' ? 30 + res.ejected.length * 150 : 4;
      if (res.kind === 'step') score += abApproach(state, [c], dir) * 3;
      score += Math.random() * (tier === 'easy' ? 60 : tier === 'medium' ? 12 : 4);
      cands.push({ marbles: [c], dir, score });
    }
    // lines of 2 and 3 along the three axes
    for (let a = 0; a < 3; a++) {
      for (const sgn of [1, -1]) {
        const line: number[] = [c];
        for (let k = 1; k <= 2; k++) {
          const cc = L.cells[c];
          const ni = L.idx(cc.q + AB_DIRS[a][0] * k * sgn, cc.r + AB_DIRS[a][1] * k * sgn);
          if (ni < 0 || state.cells[ni] !== me) break;
          line.push(ni);
          for (let dir = 0; dir < 6; dir++) {
            const key =
              line
                .slice()
                .sort((x, y) => x - y)
                .join(',') +
              '|' +
              dir;
            if (seen.has(key)) continue;
            seen.add(key);
            const res = abResolve(state, seat, line.slice(), dir);
            if ('err' in res) continue;
            let score = 6;
            if (res.kind === 'push') {
              score = 40 + res.ejected.length * 180 + res.pushed.length * 10;
            } else if (res.kind === 'step') {
              score += abApproach(state, line, dir) * 3;
            }
            score += Math.random() * (tier === 'easy' ? 60 : tier === 'medium' ? 10 : 3);
            cands.push({ marbles: line.slice(), dir, score });
          }
        }
      }
    }
  }
  if (!cands.length) return { marbles: [], dir: 0 }; // defensive
  cands.sort((x, y) => y.score - x.score);
  const top = cands.slice(0, tier === 'easy' ? Math.max(1, Math.ceil(cands.length / 4)) : 2);
  const pick = top[Math.floor(Math.random() * top.length)];
  return { marbles: pick.marbles, dir: pick.dir };
}
