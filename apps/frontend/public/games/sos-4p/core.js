/**
 * sos-4p core (frontend copy) — behavior-compatible with
 * apps/backend/src/party/games/sos4.core.ts (backend is authoritative).
 */
(function () {
  'use strict';

  const DIRS = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  function initialState(seatCount) {
    const grid = seatCount >= 4 ? 7 : 5;
    return {
      cells: Array(grid * grid).fill(null),
      scores: Array(seatCount).fill(0),
      grid,
    };
  }

  function completedAt(state, r, c) {
    const g = state.grid;
    const at = (rr, cc) =>
      rr < 0 || cc < 0 || rr >= g || cc >= g ? null : state.cells[rr * g + cc];
    const letter = state.cells[r * g + c];
    let count = 0;
    for (const [dr, dc] of DIRS) {
      if (letter === 'S' && at(r - dr, c - dc) === 'O' && at(r - 2 * dr, c - 2 * dc) === 'S')
        count++;
      if (letter === 'O' && at(r - dr, c - dc) === 'S' && at(r + dr, c + dc) === 'S') count++;
      if (letter === 'S' && at(r + dr, c + dc) === 'O' && at(r + 2 * dr, c + 2 * dc) === 'S')
        count++;
    }
    return count;
  }

  function validateMove(state, move) {
    const { cell, letter } = move;
    if (!Number.isInteger(cell) || cell < 0 || cell >= state.cells.length)
      return 'Cell out of range.';
    if (state.cells[cell] !== null) return 'That cell is taken.';
    if (letter !== 'S' && letter !== 'O') return "Letter must be 'S' or 'O'.";
    return null;
  }

  function applyMove(state, seat, move, activeSeats) {
    const cells = state.cells.slice();
    const scores = state.scores.slice();
    const { cell, letter } = move;
    cells[cell] = letter;
    const g = state.grid;
    const scored = completedAt({ ...state, cells }, Math.floor(cell / g), cell % g);
    scores[seat] += scored;
    const nextTurn =
      scored > 0 ? seat : activeSeats[(activeSeats.indexOf(seat) + 1) % activeSeats.length];
    return { state: { cells, scores, grid: state.grid }, scored, nextTurn };
  }

  function isOver(state) {
    return state.cells.every((c) => c !== null);
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

  function freeCells(state) {
    const out = [];
    for (let i = 0; i < state.cells.length; i++) if (state.cells[i] === null) out.push(i);
    return out;
  }

  function aiMove(state, tier) {
    const free = freeCells(state);
    if (free.length === 0) return { cell: -1, letter: 'S' };
    const tryLetter = (cell, letter) => {
      const cells = state.cells.slice();
      cells[cell] = letter;
      const g = state.grid;
      return completedAt({ ...state, cells }, Math.floor(cell / g), cell % g);
    };
    if (tier === 'easy') {
      const cell = free[(free.length * 11 + 3) % free.length];
      return { cell, letter: free.length % 2 === 0 ? 'S' : 'O' };
    }
    let best = null;
    for (const cell of free) {
      for (const letter of ['S', 'O']) {
        const s = tryLetter(cell, letter);
        if (s > 0 && (!best || s > best.score)) best = { cell, letter, score: s };
      }
    }
    if (best) return { cell: best.cell, letter: best.letter };
    if (tier === 'hard') {
      const g = state.grid;
      const blockish = free.filter((cell) => {
        const r = Math.floor(cell / g);
        const c = cell % g;
        const at = (rr, cc) =>
          rr < 0 || cc < 0 || rr >= g || cc >= g ? null : state.cells[rr * g + cc];
        let potential = 0;
        for (const [dr, dc] of DIRS) {
          if (at(r - dr, c - dc) === 'S' && at(r + dr, c + dc) === 'S') potential++;
        }
        return potential > 0;
      });
      if (blockish.length > 0) return { cell: blockish[0], letter: 'O' };
    }
    const cell = free[(free.length * 7 + 5) % free.length];
    return { cell, letter: state.scores.length % 2 === 0 ? 'S' : 'O' };
  }

  window.SOS4_CORE = {
    initialState,
    completedAt,
    validateMove,
    applyMove,
    isOver,
    placement,
    freeCells,
    aiMove,
  };
})();
