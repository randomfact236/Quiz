/**
 * ============================================================================
 * core.js — Dots and Boxes (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/03-dots-and-boxes.md. Same split as the rest of the family: the
 * pure model lives here (jest suite: src/__tests__/games-dots-and-boxes-core.test.ts),
 * game.js is the UI shell, the duel backend mirrors it server-side in TS.
 *
 * Geometry (n = boxes per side, 3 | 4 | 5):
 *   dots          (n+1) x (n+1) intersections
 *   horizontal    edge h(r,c): r in 0..n, c in 0..n-1  → index r*n + c
 *   vertical      edge v(r,c): r in 0..n-1, c in 0..n  → index n*(n+1) + r*(n+1) + c
 *   total edges   2n(n+1)  (n=4 → 40)
 *   box (r,c)     4 edges: h(r,c), h(r+1,c), v(r,c), v(r,c+1)
 *
 * Rules: draw one free edge; the 4th edge of a box claims it for the mover
 * (+1) and grants ANOTHER turn immediately. When every edge is drawn the
 * player with more boxes wins (equal = draw).
 * ============================================================================
 */

export const SIZES = [3, 4, 5];
export const DEFAULT_SIZE = 4;

export const edgeCount = (n) => 2 * n * (n + 1);
export const boxCount = (n) => n * n;
export const hIndex = (n, r, c) => r * n + c;
export const vIndex = (n, r, c) => n * (n + 1) + r * (n + 1) + c;
export const other = (mark) => (mark === 1 ? 2 : 1);

export function createState(n) {
  return {
    n,
    edges: new Uint8Array(edgeCount(n)), // 0 none | 1 | 2
    owners: new Int8Array(boxCount(n)), // 0 none | 1 | 2
    turn: 1,
    scores: [0, 0],
  };
}

/** The four edges of a box, in draw order (top, bottom, left, right). */
export function boxEdges(n, box) {
  const r = Math.floor(box / n);
  const c = box % n;
  return [hIndex(n, r, c), hIndex(n, r + 1, c), vIndex(n, r, c), vIndex(n, r, c + 1)];
}

/** Which boxes touch an edge (1 for a border edge, 2 for an inner one). */
export function adjacentBoxes(n, edge) {
  const out = [];
  const hCount = n * (n + 1);
  if (edge < hCount) {
    // horizontal edge h(r,c) sits between rows r and r+1
    const r = Math.floor(edge / n);
    const c = edge % n;
    if (r > 0) out.push((r - 1) * n + c);
    if (r < n) out.push(r * n + c);
  } else {
    const k = edge - hCount;
    const r = Math.floor(k / (n + 1));
    const c = k % (n + 1);
    if (c > 0) out.push(r * n + (c - 1));
    if (c < n) out.push(r * n + c);
  }
  return out;
}

/** How many edges a box still needs (0 when owned). */
export function boxOpenEdges(state, box) {
  const edges = boxEdges(state.n, box);
  let missing = 0;
  for (const e of edges) if (state.edges[e] === 0) missing++;
  return missing;
}

/** All edges still undrawn. */
export function freeEdges(state) {
  const out = [];
  for (let e = 0; e < state.edges.length; e++) if (state.edges[e] === 0) out.push(e);
  return out;
}

/**
 * Draw an edge IN PLACE. Returns
 * { ok, claimed: [box...], extraTurn, score } — claimed boxes flip to `mark`.
 */
export function drawEdge(state, edge, mark) {
  if (edge < 0 || edge >= state.edges.length || state.edges[edge] !== 0) {
    return { ok: false, claimed: [], extraTurn: false, score: 0 };
  }
  state.edges[edge] = mark;
  const claimed = [];
  for (const box of adjacentBoxes(state.n, edge)) {
    if (state.owners[box] !== 0) continue;
    if (boxOpenEdges(state, box) === 0) {
      state.owners[box] = mark;
      claimed.push(box);
    }
  }
  const score = claimed.length;
  state.scores[mark - 1] += score;
  return { ok: true, claimed, extraTurn: score > 0, score };
}

/** Every edge drawn → the match is over. */
export function isComplete(state) {
  for (let e = 0; e < state.edges.length; e++) if (state.edges[e] === 0) return false;
  return true;
}

/** Final result: { winner: 1 | 2 | 0 (draw), scores } */
export function gameResult(state) {
  const [a, b] = state.scores;
  return { winner: a === b ? 0 : a > b ? 1 : 2, scores: [a, b] };
}

/* ---- chain analysis (the hard AI's edge) ------------------------------------- */

/** Boxes with exactly `length` open edges (a "chain" is length 3). */
export function boxesWithOpenEdges(state, length) {
  const out = [];
  for (let box = 0; box < state.owners.length; box++) {
    if (state.owners[box] !== 0) continue;
    if (boxOpenEdges(state, box) !== length) continue;
    out.push(box);
  }
  return out;
}

/**
 * Chains of `length`-open-edge boxes: a run of boxes connected by shared drawn
 * edges. `length=3` is the classic "chain" that hands over the initiative.
 * Returns an array of chains (each an array of box indices).
 */
export function findChains(state, length = 3) {
  const frontier = boxesWithOpenEdges(state, length);
  const seen = new Set(frontier);
  const chains = [];
  for (const start of frontier) {
    if (seen.has(start) === false) continue;
    const chain = [start];
    seen.delete(start);
    // grow greedily: a chain extends while the neighbour has `length` open
    // edges and shares a DRAWN edge with the current tail
    let grew = true;
    while (grew) {
      grew = false;
      for (const box of frontier) {
        if (!seen.has(box)) continue; // already part of some chain
        const tailEdges = boxEdges(state.n, chain[chain.length - 1]);
        const shares = boxEdges(state.n, box).some((e) => tailEdges.includes(e));
        if (shares) {
          chain.push(box);
          seen.delete(box);
          grew = true;
        }
      }
    }
    chains.push(chain);
  }
  return chains;
}

/** Would drawing `edge` leave some box with exactly 3 open edges? */
function createsThree(state, edge) {
  for (const box of adjacentBoxes(state.n, edge)) {
    if (state.owners[box] !== 0) continue;
    // after this edge the box has (current open - 1) open edges
    if (boxOpenEdges(state, box) - 1 === 3) return true;
  }
  return false;
}

/** Boxes the player can claim right now (2 edges drawn). */
function freeBoxes(state) {
  return boxesWithOpenEdges(state, 2);
}

/** Safe move: takes a free box OR leaves no box at exactly 3. */
function safeMoves(state) {
  const out = [];
  for (const e of freeEdges(state)) {
    if (createsThree(state, e)) continue;
    out.push(e);
  }
  return out;
}

/* ---- AI -------------------------------------------------------------------- */

/** Easy AI — random edge; grabs a free box when it notices one. */
export function easyMove(state, toMove) {
  const free = freeBoxes(state);
  if (free.length > 0) {
    const box = free[Math.floor(Math.random() * free.length)];
    // finish any of the box's two open edges
    const open = boxEdges(state.n, box).filter((e) => state.edges[e] === 0);
    return open[0];
  }
  const moves = freeEdges(state);
  if (moves.length === 0) return -1;
  return moves[Math.floor(Math.random() * moves.length)];
}

/** Medium AI — take every free box, never open a box to three if a safe move
 *  exists, else sacrifice the smallest chain. */
export function mediumMove(state, toMove) {
  let free = freeBoxes(state);
  if (free.length > 0) {
    const box = free[0];
    return boxEdges(state.n, box).find((e) => state.edges[e] === 0);
  }
  const safe = safeMoves(state);
  if (safe.length > 0) return safe[Math.floor(Math.random() * safe.length)];
  const moves = freeEdges(state);
  return moves.length ? moves[Math.floor(Math.random() * moves.length)] : -1;
}

/**
 * Hard AI — chain control: take free boxes; if the only progress opens a
 * chain, open the SHORTEST one and (all-but-two rule) take the whole chain
 * unless the opponent has already claimed two of its boxes. Very hard for a
 * casual opponent; not a solved engine.
 */
export function hardMove(state, toMove) {
  let free = freeBoxes(state);
  if (free.length > 0) {
    const box = free[0];
    return boxEdges(state.n, box).find((e) => state.edges[e] === 0);
  }
  const safe = safeMoves(state);
  if (safe.length > 0) {
    // prefer a safe move that also threatens a free box next turn
    let best = safe[0];
    let bestScore = -Infinity;
    for (const e of safe) {
      const score = boxesWithOpenEdges(state, 2).length * 2 - createsThreeCount(state, e);
      if (score > bestScore) {
        bestScore = score;
        best = e;
      }
    }
    return best;
  }
  // every move opens a chain: give away the smallest one
  const chains = findChains(state, 3);
  if (chains.length > 0) {
    let smallest = chains[0];
    for (const chain of chains) if (chain.length < smallest.length) smallest = chain;
    // all-but-two: if the opponent already owns 2 boxes inside this chain, it
    // is a trap — open a DIFFERENT chain instead
    const opp = other(toMove);
    const owned = smallest.filter((b) => state.owners[b] === opp).length;
    if (owned >= 2 && chains.length > 1) {
      const alt = chains.find((c) => !smallest.includes(c[0]));
      const target = alt || smallest;
      const box = target[0];
      return boxEdges(state.n, box).find((e) => state.edges[e] === 0);
    }
    const box = smallest[0];
    return boxEdges(state.n, box).find((e) => state.edges[e] === 0);
  }
  const moves = freeEdges(state);
  return moves.length ? moves[0] : -1;
}

function createsThreeCount(state, edge) {
  let count = 0;
  for (const box of adjacentBoxes(state.n, edge)) {
    if (state.owners[box] !== 0) continue;
    if (boxOpenEdges(state, box) - 1 === 3) count++;
  }
  return count;
}

export function aiMove(state, toMove, difficulty) {
  if (difficulty === 'hard') return hardMove(state, toMove);
  if (difficulty === 'medium') return mediumMove(state, toMove);
  return easyMove(state, toMove);
}
