/**
 * tri-nim core (frontend copy) — mirrors apps/backend/src/party/games/tri-nim.core.ts.
 */
(function () {
  'use strict';
  const ROWS = [3, 4, 5];
  function initialState() {
    return { rows: ROWS.slice(), turn: 0, prevMover: null, lastMover: null };
  }
  function validateMove(state, move) {
    const { row, count } = move;
    if (!Number.isInteger(row) || row < 0 || row >= state.rows.length) return 'Row out of range.';
    if (!Number.isInteger(count) || count < 1 || count > 3) return 'Take 1 to 3 sticks.';
    if (count > state.rows[row]) return 'Not enough sticks in that row.';
    return null;
  }
  function applyMove(state, seat, move) {
    const rows = state.rows.slice();
    rows[move.row] -= move.count;
    return { rows, turn: (seat + 1) % 3, prevMover: state.lastMover, lastMover: seat };
  }
  function isOver(state) {
    return state.rows.every(function (r) {
      return r === 0;
    });
  }
  function winner(state) {
    return isOver(state) ? state.prevMover : null;
  }
  function placement(state) {
    const last = state.lastMover;
    const first = state.prevMover;
    const second = [0, 1, 2].find(function (s) {
      return s !== last && s !== first;
    });
    return [
      { seat: first, rank: 1 },
      { seat: second, rank: 2 },
      { seat: last, rank: 3 },
    ].filter(function (p) {
      return p.seat >= 0;
    });
  }
  window.TRINIM_CORE = { ROWS, initialState, validateMove, applyMove, isOver, winner, placement };
})();
