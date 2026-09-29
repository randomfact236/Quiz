/**
 * code-race core (frontend copy) — mirrors coderace-mp.core.ts. The SECRET
 * never reaches the client while racing; scoring happens locally only for
 * offline practice (hot-seat is not offered for hidden-info games).
 */
(function () {
  'use strict';
  const LEN = 4;
  const VALUES = 6;
  const LIMIT = 10;
  function initialState(seatCount) {
    return {
      phase: 'setting',
      code: null,
      makerSeat: 0,
      breakerSeats: Array.from({ length: seatCount - 1 }, function (_, i) {
        return i + 1;
      }),
      rows: {},
      turn: 0,
      seatCount: seatCount,
    };
  }
  function scoreGuess(code, guess) {
    let black = 0;
    const codeRest = [];
    const guessRest = [];
    for (let i = 0; i < LEN; i++) {
      if (guess[i] === code[i]) black += 1;
      else {
        codeRest.push(code[i]);
        guessRest.push(guess[i]);
      }
    }
    let white = 0;
    const pool = {};
    codeRest.forEach(function (v) {
      pool[v] = (pool[v] || 0) + 1;
    });
    guessRest.forEach(function (v) {
      if (pool[v] > 0) {
        white += 1;
        pool[v] -= 1;
      }
    });
    return { black: black, white: white };
  }
  function validateCode(code) {
    if (!Array.isArray(code) || code.length !== LEN) return 'The code must be 4 pegs.';
    for (const v of code)
      if (!Number.isInteger(v) || v < 1 || v > VALUES) return 'Pegs must be values 1-6.';
    return null;
  }
  window.CRCORE = { LEN, VALUES, LIMIT, initialState, scoreGuess, validateCode };
})();
