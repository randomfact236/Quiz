/**
 * Ludo Snakes core — board geometry for rendering (rules live server-side).
 * Same cross board as Ludo MP, plus the jump table for connectors + toasts.
 * Jump table mirrors apps/backend/src/party/games/ludo-mp.core.ts LUDO_JUMPS.
 */
(function () {
  'use strict';
  var RING = 52;

  function ringCell(seat, dist) {
    if (dist < 1 || dist > 51) return null;
    return (seat * 13 + dist - 1) % RING;
  }

  /** 52-cell ring laid out on the classic 15x15 cross. */
  var TRACK = [
    [6, 0],
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [5, 5],
    [4, 5],
    [3, 5],
    [2, 5],
    [1, 5],
    [0, 5],
    [0, 6],
    [0, 7],
    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
    [5, 8],
    [5, 9],
    [5, 10],
    [5, 11],
    [5, 12],
    [5, 13],
    [5, 14],
    [6, 14],
    [7, 14],
    [8, 14],
    [8, 13],
    [8, 12],
    [8, 11],
    [8, 10],
    [8, 9],
    [9, 8],
    [10, 8],
    [11, 8],
    [12, 8],
    [13, 8],
    [14, 8],
    [14, 7],
    [14, 6],
    [13, 6],
    [12, 6],
    [11, 6],
    [10, 6],
    [9, 5],
    [9, 4],
    [9, 3],
    [9, 2],
    [9, 1],
    [9, 0],
    [8, 0],
  ];
  function ringRC(cell) {
    var rc = TRACK[cell % TRACK.length];
    return { r: rc[0], c: rc[1] };
  }

  function homeRC(seat, dist) {
    var step = dist - 52; // 0..3
    if (seat === 0) return { r: 7, c: 1 + step };
    if (seat === 1) return { r: 1 + step, c: 7 };
    if (seat === 2) return { r: 7, c: 13 - step };
    return { r: 13 - step, c: 7 };
  }

  var YARD = [
    { r: 2, c: 2 },
    { r: 2, c: 12 },
    { r: 12, c: 2 },
    { r: 12, c: 12 },
  ];

  var START = [0, 13, 26, 39];

  /** Mirrors backend LUDO_JUMPS: ring cell -> ring cell (ladders climb, snakes slide). */
  var JUMPS = {
    1: 22,
    6: 17,
    10: 31,
    27: 45,
    34: 48,
    24: 5,
    38: 15,
    43: 19,
    50: 33,
  };
  /** Ring cells where a ladder STARTS (draw green), snakes (draw red). */
  var LADDER_FROM = [1, 6, 10, 27, 34];
  var SNAKE_FROM = [24, 38, 43, 50];

  window.LUDOCORE = {
    ringCell: ringCell,
    ringRC: ringRC,
    homeRC: homeRC,
    YARD: YARD,
    START: START,
    RING: RING,
    JUMPS: JUMPS,
    LADDER_FROM: LADDER_FROM,
    SNAKE_FROM: SNAKE_FROM,
    TRACK: TRACK,
  };
})();
