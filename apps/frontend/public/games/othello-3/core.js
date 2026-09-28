/**
 * othello-3 core (frontend copy) — mirrors apps/backend/src/party/games/flip-mp.core.ts.
 */
(function () {
  'use strict';
  const DIRS = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [-1, 1],
  ];
  function geometry(seatCount) {
    return { size: seatCount >= 4 ? 14 : 10 };
  }
  function openingGrid(seatCount, size) {
    const grid = Array.from({ length: size }, function () {
      return Array(size).fill(0);
    });
    const mid = Math.floor(size / 2);
    if (seatCount === 3) {
      const r = mid - 1;
      [mid - 4, mid - 2, mid].forEach(function (c0, s) {
        for (let dr = 0; dr < 2; dr++) for (let dc = 0; dc < 2; dc++) grid[r + dr][c0 + dc] = s + 1;
      });
    } else {
      [
        [mid - 2, mid - 2],
        [mid - 2, mid],
        [mid, mid - 2],
        [mid, mid],
      ].forEach(function (rc, s) {
        for (let dr = 0; dr < 2; dr++)
          for (let dc = 0; dc < 2; dc++) grid[rc[0] + dr][rc[1] + dc] = s + 1;
      });
    }
    return grid;
  }
  function initialState(seatCount) {
    const size = geometry(seatCount).size;
    const grid = openingGrid(seatCount, size);
    const scores = Array(seatCount).fill(0);
    grid.forEach(function (row) {
      row.forEach(function (v) {
        if (v > 0) scores[v - 1] += 1;
      });
    });
    return { size: size, seatCount: seatCount, grid: grid, scores: scores, passStreak: 0 };
  }
  function linesFor(state, seat, r, c) {
    const sym = seat + 1;
    const out = [];
    for (const d of DIRS) {
      const line = [];
      let rr = r + d[0];
      let cc = c + d[1];
      while (
        rr >= 0 &&
        cc >= 0 &&
        rr < state.size &&
        cc < state.size &&
        state.grid[rr][cc] !== 0 &&
        state.grid[rr][cc] !== sym
      ) {
        line.push([rr, cc]);
        rr += d[0];
        cc += d[1];
      }
      if (
        line.length > 0 &&
        rr >= 0 &&
        cc >= 0 &&
        rr < state.size &&
        cc < state.size &&
        state.grid[rr][cc] === sym
      )
        out.push(line);
    }
    return out;
  }
  function legalMoves(state, seat) {
    const out = [];
    for (let r = 0; r < state.size; r++)
      for (let c = 0; c < state.size; c++) {
        if (state.grid[r][c] !== 0) continue;
        if (linesFor(state, seat, r, c).length > 0) out.push(r * state.size + c);
      }
    return out;
  }
  function validateMove(state, seat, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= state.size * state.size)
      return 'Cell out of range.';
    if (state.grid[Math.floor(cell / state.size)][cell % state.size] !== 0)
      return 'That cell is taken.';
    const r = Math.floor(cell / state.size);
    const c = cell % state.size;
    if (linesFor(state, seat, r, c).length === 0) return 'That move flips nothing.';
    return null;
  }
  function applyMove(state, seat, cell) {
    const grid = state.grid.map(function (row) {
      return row.slice();
    });
    const scores = state.scores.slice();
    const r = Math.floor(cell / state.size);
    const c = cell % state.size;
    const lines = linesFor(state, seat, r, c);
    grid[r][c] = seat + 1;
    scores[seat] += 1;
    lines.forEach(function (line) {
      line.forEach(function (rc) {
        scores[grid[rc[0]][rc[1]] - 1] -= 1;
        grid[rc[0]][rc[1]] = seat + 1;
        scores[seat] += 1;
      });
    });
    let skip = 0;
    let probe = (seat + 1) % state.seatCount;
    while (
      skip < state.seatCount &&
      legalMoves(
        { size: state.size, seatCount: state.seatCount, grid: grid, scores: scores, passStreak: 0 },
        probe
      ).length === 0
    ) {
      skip += 1;
      probe = (probe + 1) % state.seatCount;
    }
    const full = grid.every(function (row) {
      return row.every(function (v) {
        return v !== 0;
      });
    });
    return {
      size: state.size,
      seatCount: state.seatCount,
      grid: grid,
      scores: scores,
      passStreak: full ? state.seatCount : skip,
    };
  }
  function isOver(state) {
    return state.passStreak >= state.seatCount;
  }
  function placement(scores) {
    const order = scores
      .map(function (s, seat) {
        return { seat: seat, s: s };
      })
      .sort(function (a, b) {
        return b.s - a.s || a.seat - b.seat;
      });
    const ranks = [];
    let lastScore = NaN;
    let lastRank = 0;
    order.forEach(function (row, i) {
      if (row.s === lastScore) ranks[row.seat] = lastRank;
      else {
        ranks[row.seat] = i + 1;
        lastRank = i + 1;
        lastScore = row.s;
      }
    });
    return order.map(function (row) {
      return { seat: row.seat, rank: ranks[row.seat] };
    });
  }
  function aiMove(state, seat, tier) {
    const legal = legalMoves(state, seat);
    if (legal.length === 0) return -1;
    if (tier === 'easy') return legal[(legal.length * 7 + seat) % legal.length];
    let best = legal[0];
    let bestScore = -1;
    for (const cell of legal) {
      const r = Math.floor(cell / state.size);
      const c = cell % state.size;
      const lines = linesFor(state, seat, r, c);
      let score = 0;
      lines.forEach(function (line) {
        score += line.length;
      });
      if (tier === 'hard') {
        if ((r === 0 || r === state.size - 1) && (c === 0 || c === state.size - 1)) score += 25;
        else if (r === 0 || r === state.size - 1 || c === 0 || c === state.size - 1) score += 8;
        else if (r === 1 || r === state.size - 2 || c === 1 || c === state.size - 2) score -= 3;
      }
      if (score > bestScore) {
        bestScore = score;
        best = cell;
      }
    }
    return best;
  }
  window.FLIP_CORE = {
    geometry,
    initialState,
    legalMoves,
    validateMove,
    applyMove,
    isOver,
    placement,
    aiMove,
    linesFor,
  };
})();
