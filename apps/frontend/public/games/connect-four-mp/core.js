/**
 * connect-four-mp core (frontend copy) — mirrors c4mp.core.ts (backend authoritative).
 */
(function () {
  'use strict';
  function geometry(seatCount) {
    return seatCount >= 4 ? { cols: 10, rows: 10, lineLen: 4 } : { cols: 8, rows: 8, lineLen: 4 };
  }
  function initialState(seatCount) {
    const g = geometry(seatCount);
    return {
      cols: g.cols,
      rows: g.rows,
      lineLen: g.lineLen,
      grid: Array.from({ length: g.rows }, function () {
        return Array(g.cols).fill(0);
      }),
      heights: Array(g.cols).fill(0),
    };
  }
  function validateMove(state, col) {
    if (!Number.isInteger(col) || col < 0 || col >= state.cols) return 'Column out of range.';
    if (state.heights[col] >= state.rows) return 'That column is full.';
    return null;
  }
  function applyMove(state, seat, col) {
    const grid = state.grid.map(function (r) {
      return r.slice();
    });
    const r = state.rows - 1 - state.heights[col];
    grid[r][col] = seat + 1;
    const heights = state.heights.slice();
    heights[col] += 1;
    return {
      cols: state.cols,
      rows: state.rows,
      lineLen: state.lineLen,
      grid: grid,
      heights: heights,
    };
  }
  function anyWin(state) {
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ];
    for (let s = 1; s <= 4; s++) {
      for (let r = 0; r < state.rows; r++) {
        for (let c = 0; c < state.cols; c++) {
          if (state.grid[r][c] !== s) continue;
          for (const d of dirs) {
            let count = 0,
              rr = r,
              cc = c;
            while (
              rr >= 0 &&
              cc >= 0 &&
              rr < state.rows &&
              cc < state.cols &&
              state.grid[rr][cc] === s
            ) {
              count++;
              rr += d[0];
              cc += d[1];
            }
            if (count >= state.lineLen) return s - 1;
          }
        }
      }
    }
    return null;
  }
  function isFull(state) {
    return state.heights.every(function (h) {
      return h >= state.rows;
    });
  }
  function isOver(state) {
    return anyWin(state) !== null || isFull(state);
  }
  function placement(seatCount, winnerSeat) {
    const out = [];
    for (let s = 0; s < seatCount; s++)
      out.push({ seat: s, rank: winnerSeat === null ? 1 : s === winnerSeat ? 1 : 2 });
    return out;
  }
  window.C4MP_CORE = {
    geometry,
    initialState,
    validateMove,
    applyMove,
    anyWin,
    isFull,
    isOver,
    placement,
  };
})();
