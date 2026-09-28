/**
 * dots-boxes-4p core (frontend copy) — behavior-compatible with
 * apps/backend/src/party/games/db4.core.ts (backend is authoritative).
 */
(function () {
  'use strict';

  const N = 4;
  const EDGE_COUNT = 2 * N * (N + 1); // 40
  const H_COUNT = N * (N + 1); // 20

  function initialState(seatCount) {
    return {
      edges: Array(EDGE_COUNT).fill(0),
      owners: Array(N * N).fill(0),
      scores: Array(seatCount).fill(0),
    };
  }

  const hIndex = (r, c) => r * N + c;
  const vIndex = (r, c) => H_COUNT + r * (N + 1) + c;

  function boxEdges(box) {
    const r = Math.floor(box / N);
    const c = box % N;
    return [hIndex(r, c), hIndex(r + 1, c), vIndex(r, c), vIndex(r, c + 1)];
  }

  function adjacentBoxes(edge) {
    const out = [];
    if (edge < H_COUNT) {
      const r = Math.floor(edge / N);
      const c = edge % N;
      if (r > 0) out.push((r - 1) * N + c);
      if (r < N) out.push(r * N + c);
    } else {
      const k = edge - H_COUNT;
      const r = Math.floor(k / (N + 1));
      const c = k % (N + 1);
      if (c > 0) out.push(r * N + (c - 1));
      if (c < N) out.push(r * N + c);
    }
    return out;
  }

  function validateMove(state, edge) {
    if (!Number.isInteger(edge) || edge < 0 || edge >= EDGE_COUNT) return 'Edge out of range.';
    if (state.edges[edge] !== 0) return 'That edge is already drawn.';
    return null;
  }

  function applyMove(state, seat, edge, activeSeats) {
    const edges = state.edges.slice();
    const owners = state.owners.slice();
    const scores = state.scores.slice();
    edges[edge] = seat + 1;
    const claimed = [];
    for (const box of adjacentBoxes(edge)) {
      if (owners[box] !== 0) continue;
      const [a, b, c, d] = boxEdges(box);
      if (edges[a] && edges[b] && edges[c] && edges[d]) {
        owners[box] = seat + 1;
        scores[seat] += 1;
        claimed.push(box);
      }
    }
    const nextTurn =
      claimed.length > 0 ? seat : activeSeats[(activeSeats.indexOf(seat) + 1) % activeSeats.length];
    return { state: { edges, owners, scores }, claimed, nextTurn };
  }

  function isOver(state) {
    return state.edges.every((e) => e !== 0);
  }

  function placement(scores) {
    const order = scores
      .map((s, seat) => ({ seat, s }))
      .sort((a, b) => b.s - a.s || a.seat - b.seat);
    const ranks = [];
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
    return order.map((row) => ({ seat: row.seat, rank: ranks[row.seat] }));
  }

  function freeEdges(state) {
    const out = [];
    for (let e = 0; e < EDGE_COUNT; e++) if (state.edges[e] === 0) out.push(e);
    return out;
  }

  function openCount(state, box) {
    return boxEdges(box).filter((e) => state.edges[e] === 0).length;
  }

  function completesBox(state, edge) {
    return adjacentBoxes(edge).some(
      (box) => state.owners[box] === 0 && openCount(state, box) === 1
    );
  }

  function aiMove(state, tier) {
    const free = freeEdges(state);
    if (free.length === 0) return -1;
    if (tier === 'easy') {
      const win = free.find((e) => completesBox(state, e));
      if (win !== undefined && free.length % 2 === 0) return win;
      return free[(free.length * 5 + 7) % free.length];
    }
    const scoring = free.find((e) => completesBox(state, e));
    if (scoring !== undefined) return scoring;
    const safe = free.filter(
      (e) => !adjacentBoxes(e).some((box) => state.owners[box] === 0 && openCount(state, box) === 3)
    );
    const pool = safe.length > 0 ? safe : free;
    if (tier === 'hard') {
      const best = pool.filter((e) =>
        adjacentBoxes(e).every((box) => state.owners[box] !== 0 || openCount(state, box) >= 3)
      );
      if (best.length > 0) return best[(best.length * 3 + free.length) % best.length];
    }
    return pool[(pool.length * 7 + free.length) % pool.length];
  }

  window.DB4_CORE = {
    N,
    EDGE_COUNT,
    H_COUNT,
    hIndex,
    vIndex,
    boxEdges,
    adjacentBoxes,
    initialState,
    validateMove,
    applyMove,
    isOver,
    placement,
    freeEdges,
    openCount,
    completesBox,
    aiMove,
  };
})();
