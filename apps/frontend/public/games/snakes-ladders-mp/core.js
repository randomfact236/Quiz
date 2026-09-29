/**
 * snakes-ladders-mp core (frontend copy) — mirrors snl-mp.core.ts.
 * The SERVER rolls; this copy renders only.
 */
(function () {
  'use strict';
  const GOAL = 100;
  const LADDERS = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
  const SNAKES = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 98: 79 };
  function initialState(seatCount) {
    return {
      positions: Array(seatCount).fill(0),
      turn: 0,
      seatCount: seatCount,
      lastRoll: null,
      finished: [],
    };
  }
  function land(from, roll) {
    let pos = from + roll;
    let bounced = false;
    let chute = null;
    if (pos > GOAL) {
      pos = GOAL - (pos - GOAL);
      bounced = true;
    }
    if (LADDERS[pos]) {
      pos = LADDERS[pos];
      chute = 'ladder';
    } else if (SNAKES[pos]) {
      pos = SNAKES[pos];
      chute = 'snake';
    }
    return { pos: pos, bounced: bounced, chute: chute };
  }
  function isOver(state) {
    return state.finished.length > 0;
  }
  function placement(state) {
    const out = [];
    if (state.finished.length > 0) out.push({ seat: state.finished[0], rank: 1 });
    const rest = state.positions
      .map(function (p, seat) {
        return { seat: seat, p: p };
      })
      .filter(function (row) {
        return row.seat !== state.finished[0];
      })
      .sort(function (a, b) {
        return b.p - a.p || a.seat - b.seat;
      });
    const base = state.finished.length > 0 ? 2 : 1;
    let lastPos = NaN;
    let lastRank = 0;
    rest.forEach(function (row, i) {
      let rank;
      if (row.p === lastPos) rank = lastRank;
      else {
        rank = base + i;
        lastRank = rank;
        lastPos = row.p;
      }
      out.push({ seat: row.seat, rank: rank });
    });
    return out;
  }
  window.SNLCORE = { GOAL, LADDERS, SNAKES, initialState, land, isOver, placement };
})();
