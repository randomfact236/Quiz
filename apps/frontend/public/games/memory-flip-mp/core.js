/**
 * memory-flip-mp core (frontend copy) — mirrors memory-mp.core.ts.
 * Deck values NEVER reach the client; the client renders revealed/claimed only.
 */
(function () {
  'use strict';
  function isOver(state) {
    return state.claimed.every(function (c) {
      return c !== 0;
    });
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
  window.MEMCORE = { isOver, placement };
})();
