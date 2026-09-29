/**
 * Checkers MP core — client port of apps/backend/src/party/games/checkers-mp.core.ts
 * (pure rules mirror: legal-move computation for the UI; the server remains
 * authoritative and re-validates every move).
 * Exposes window.CMPCORE.
 */
(function () {
  'use strict';

  function geometry(variant) {
    return variant === 'checkers-hex' ? { size: 8, seatCount: 3 } : { size: 10, seatCount: 4 };
  }

  function fwdDirs(variant, seat) {
    if (variant === 'checkers-hex') {
      if (seat === 0 || seat === 1)
        return [
          [1, -1],
          [1, 1],
        ];
      return [
        [-1, -1],
        [-1, 1],
      ];
    }
    if (seat === 0)
      return [
        [1, -1],
        [1, 1],
      ];
    if (seat === 1)
      return [
        [-1, -1],
        [1, -1],
      ];
    if (seat === 2)
      return [
        [-1, -1],
        [-1, 1],
      ];
    return [
      [-1, 1],
      [1, 1],
    ];
  }

  function ownCells(state, seat) {
    var out = [];
    for (var r = 0; r < state.size; r++)
      for (var c = 0; c < state.size; c++)
        if (state.grid[r][c] === seat + 1) out.push(r * state.size + c);
    return out;
  }

  /** All jumps for the seat (or for a locked chain piece). */
  function jumps(state, seat) {
    var out = [];
    var sources =
      state.chainCell !== null && state.chainCell !== undefined
        ? [state.chainCell]
        : ownCells(state, seat);
    for (var k = 0; k < sources.length; k++) {
      var idx = sources[k];
      var r = Math.floor(idx / state.size),
        c = idx % state.size;
      var dirs = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      for (var d = 0; d < dirs.length; d++) {
        var mr = r + dirs[d][0],
          mc = c + dirs[d][1];
        var tr = r + 2 * dirs[d][0],
          tc = c + 2 * dirs[d][1];
        if (tr < 0 || tc < 0 || tr >= state.size || tc >= state.size) continue;
        var mid = state.grid[mr][mc];
        var to = state.grid[tr][tc];
        if (mid !== 0 && mid !== seat + 1 && to === 0)
          out.push({ from: idx, over: mr * state.size + mc, to: tr * state.size + tc });
      }
    }
    return out;
  }

  function steps(state, seat) {
    var out = [];
    var sources =
      state.chainCell !== null && state.chainCell !== undefined ? [] : ownCells(state, seat);
    for (var k = 0; k < sources.length; k++) {
      var idx = sources[k];
      var r = Math.floor(idx / state.size),
        c = idx % state.size;
      var dirs = fwdDirs(state.variant, seat);
      for (var d = 0; d < dirs.length; d++) {
        var tr = r + dirs[d][0],
          tc = c + dirs[d][1];
        if (tr < 0 || tc < 0 || tr >= state.size || tc >= state.size) continue;
        if (state.grid[tr][tc] === 0) out.push({ from: idx, to: tr * state.size + tc });
      }
    }
    return out;
  }

  /** Legal moves — multi-jumps mandatory. Each item: {from, to, jump}. */
  function legalMoves(state, seat) {
    var js = jumps(state, seat);
    if (js.length > 0)
      return js.map(function (j) {
        return { from: j.from, to: j.to, jump: j };
      });
    return steps(state, seat).map(function (s) {
      return { from: s.from, to: s.to, jump: null };
    });
  }

  function validateMove(state, seat, move) {
    var legal = legalMoves(state, seat);
    var hit = null;
    for (var i = 0; i < legal.length; i++)
      if (legal[i].from === move.from && legal[i].to === move.to) hit = legal[i];
    if (!hit) return 'Illegal move for your men (multi-jumps are mandatory).';
    if (state.chainCell !== null && state.chainCell !== undefined && state.chainCell !== move.from)
      return 'Finish the jump chain first.';
    return null;
  }

  window.CMPCORE = {
    geometry: geometry,
    legalMoves: legalMoves,
    validateMove: validateMove,
    jumps: jumps,
  };
})();
