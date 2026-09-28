/**
 * Dots & Boxes 4P (F1, MP1 Wave A) — PURE core, backend-owned.
 *
 * Family geometry is IDENTICAL to the 2P game (n=4 → 40 edges, 16 boxes);
 * the party difference: scores[] per seat, owners carry SEAT INDEXES, and a
 * completed box keeps the SAME seat's turn going (extra-turn chains), while
 * a free edge passes to the next ACTIVE seat.
 *
 * Empty-board rule: the lattice starts bare; every edge is a player decision.
 */

export const DB4_N = 4; // boxes per side (4x4 = 16 boxes, 40 edges)

export const db4EdgeCount = 2 * DB4_N * (DB4_N + 1); // 40
export const db4BoxCount = DB4_N * DB4_N; // 16
export const db4HCount = DB4_N * (DB4_N + 1); // 20 horizontal edges

export interface Db4State {
  /** 0 = free, else 1..4 = seat index + 1 who drew it. */
  edges: number[];
  /** 0 = unclaimed, else seat index + 1. */
  owners: number[];
  scores: number[]; // per seat
}

export function db4InitialState(seatCount: number): Db4State {
  return {
    edges: Array<number>(db4EdgeCount).fill(0),
    owners: Array<number>(db4BoxCount).fill(0),
    scores: Array<number>(seatCount).fill(0),
  };
}

export function db4BoxEdges(box: number): number[] {
  const r = Math.floor(box / DB4_N);
  const c = box % DB4_N;
  return [db4HIndex(r, c), db4HIndex(r + 1, c), db4VIndex(r, c), db4VIndex(r, c + 1)];
}

export function db4HIndex(r: number, c: number): number {
  return r * DB4_N + c;
}

export function db4VIndex(r: number, c: number): number {
  return db4HCount + r * (DB4_N + 1) + c;
}

/** Boxes touching an edge (1 border / 2 inner). */
export function db4AdjacentBoxes(edge: number): number[] {
  const out: number[] = [];
  if (edge < db4HCount) {
    const r = Math.floor(edge / DB4_N);
    const c = edge % DB4_N;
    if (r > 0) out.push((r - 1) * DB4_N + c);
    if (r < DB4_N) out.push(r * DB4_N + c);
  } else {
    const k = edge - db4HCount;
    const r = Math.floor(k / (DB4_N + 1));
    const c = k % (DB4_N + 1);
    if (c > 0) out.push(r * DB4_N + (c - 1));
    if (c < DB4_N) out.push(r * DB4_N + c);
  }
  return out;
}

export function db4ValidateMove(state: Db4State, edge: number): string | null {
  if (!Number.isInteger(edge) || edge < 0 || edge >= db4EdgeCount) return 'Edge out of range.';
  if (state.edges[edge] !== 0) return 'That edge is already drawn.';
  return null;
}

/** Apply + resolve claims. Returns next state + who moves next (extra turns). */
export function db4ApplyMove(
  state: Db4State,
  seat: number,
  edge: number,
  activeSeats: number[]
): { state: Db4State; claimed: number[]; nextTurn: number } {
  const edges = state.edges.slice();
  const owners = state.owners.slice();
  const scores = state.scores.slice();
  edges[edge] = seat + 1;

  const claimed: number[] = [];
  for (const box of db4AdjacentBoxes(edge)) {
    if (owners[box] === 0) {
      const [a, b, c, d] = db4BoxEdges(box);
      if (edges[a] !== 0 && edges[b] !== 0 && edges[c] !== 0 && edges[d] !== 0) {
        owners[box] = seat + 1;
        scores[seat] += 1;
        claimed.push(box);
      }
    }
  }

  // Box(es) claimed → same seat moves again; otherwise next ACTIVE seat.
  let nextTurn: number;
  if (claimed.length > 0) {
    nextTurn = seat;
  } else {
    const pos = activeSeats.indexOf(seat);
    nextTurn = activeSeats[(pos + 1) % activeSeats.length];
  }
  return { state: { edges, owners, scores }, claimed, nextTurn };
}

export function db4IsOver(state: Db4State): boolean {
  return state.edges.every((e) => e !== 0);
}

/** Placement: most boxes 1st; ties share rank. */
export function db4Placement(scores: number[]): { seat: number; rank: number }[] {
  const order = scores.map((s, seat) => ({ seat, s })).sort((a, b) => b.s - a.s || a.seat - b.seat);
  return order.map((row, i) => ({
    seat: row.seat,
    rank: ranksOfOrder(order)[row.seat],
  }));
}

function ranksOfOrder(order: { seat: number; s: number }[]): number[] {
  const ranks: number[] = [];
  let lastScore = NaN;
  let lastRank = 0;
  order.forEach((row, i) => {
    if (row.s === lastScore) ranks[row.seat] = lastRank;
    else {
      ranks[row.seat] = i + 1;
      lastRank = i + 1;
      lastScore = row.s;
    }
  });
  return ranks;
}
/** AI: finish own boxes → safe edge (box stays ≥2 open) → any free edge. */
export function db4AiMove(state: Db4State, tier: 'easy' | 'medium' | 'hard'): number {
  const free: number[] = [];
  for (let e = 0; e < db4EdgeCount; e++) if (state.edges[e] === 0) free.push(e);
  if (free.length === 0) return -1;

  const completes = (e: number): boolean =>
    db4AdjacentBoxes(e).some((box) => {
      const [a, b, c, d] = db4BoxEdges(box);
      const drawn = [state.edges[a], state.edges[b], state.edges[c], state.edges[d]];
      return drawn.filter((v) => v !== 0).length === 3;
    });

  if (tier === 'easy') {
    const win = free.find(completes);
    if (win !== undefined && free.length % 2 === 0) return win;
    return free[(free.length * 5 + 7) % free.length];
  }

  const scoring = free.find(completes);
  if (scoring !== undefined) return scoring;

  // Prefer edges that DON'T hand the next seat a 3-sided box.
  const safe = free.filter(
    (e) =>
      !db4AdjacentBoxes(e).some((box) => state.owners[box] === 0 && openCount(state, box) === 3)
  );
  const pool = safe.length > 0 ? safe : free;
  if (tier === 'hard') {
    // Among safe edges, keep boxes ≥3 open (harder to gift chains).
    const best = pool.filter((e) =>
      db4AdjacentBoxes(e).every((box) => state.owners[box] !== 0 || openCount(state, box) >= 3)
    );
    if (best.length > 0) return best[(best.length * 3 + free.length) % best.length];
  }
  return pool[(pool.length * 7 + free.length) % pool.length];
}

function openCount(state: Db4State, box: number): number {
  const [a, b, c, d] = db4BoxEdges(box);
  return [state.edges[a], state.edges[b], state.edges[c], state.edges[d]].filter((v) => v === 0)
    .length;
}
