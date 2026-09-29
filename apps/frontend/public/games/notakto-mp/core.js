/**
 * notakto-mp core (frontend copy) — mirrors notakto-mp.core.ts.
 */
(function () {
  'use strict';
  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  const CELLS = 27;
  function initialState(seatCount) {
    return { cells: Array(CELLS).fill(null), seats: seatCount, eliminated: [], turn: 0 };
  }
  function living(state) {
    const out = [];
    for (let s = 0; s < state.seats; s++) if (!state.eliminated.includes(s)) out.push(s);
    return out;
  }
  function boardHasLine(cells, board) {
    const base = board * 9;
    return LINES.some(function (line) {
      return line.every(function (i) {
        return cells[base + i] !== null;
      });
    });
  }
  function allFull(cells) {
    return cells.every(function (c) {
      return c !== null;
    });
  }
  function validateMove(state, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) return 'Cell out of range.';
    if (state.cells[cell] !== null) return 'That cell is taken.';
    return null;
  }
  function applyMove(state, seat, cell) {
    const cells = state.cells.slice();
    cells[cell] = 'X';
    const board = Math.floor(cell / 9);
    const lost = boardHasLine(cells, board) || allFull(cells);
    const eliminated = lost ? state.eliminated.concat([seat]) : state.eliminated;
    let next = (seat + 1) % state.seats;
    let guard = 0;
    while (guard < state.seats && eliminated.includes(next)) {
      next = (next + 1) % state.seats;
      guard += 1;
    }
    return { cells: cells, seats: state.seats, eliminated: eliminated, turn: next };
  }
  function isOver(state) {
    return living(state).length <= 1 || allFull(state.cells);
  }
  function placement(state) {
    const lv = living(state);
    const out = [];
    if (lv.length === 1) {
      out.push({ seat: lv[0], rank: 1 });
      state.eliminated
        .slice()
        .reverse()
        .forEach(function (s, i) {
          out.push({ seat: s, rank: i + 2 });
        });
    } else {
      lv.forEach(function (s) {
        out.push({ seat: s, rank: 1 });
      });
      state.eliminated
        .slice()
        .reverse()
        .forEach(function (s, i) {
          out.push({ seat: s, rank: lv.length + 1 + i });
        });
    }
    return out;
  }
  window.NKCORE = {
    LINES,
    CELLS,
    initialState,
    living,
    boardHasLine,
    allFull,
    validateMove,
    applyMove,
    isOver,
    placement,
  };
})();
