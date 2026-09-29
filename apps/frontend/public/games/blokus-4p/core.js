/**
 * Blokus MP core — client port of apps/backend/src/party/games/blokus-mp.core.ts
 * (rules mirror for the UI: orientations, validation, has-any-move).
 * The server remains authoritative and re-validates every move.
 * Exposes window.BLKCORE.
 */
(function () {
  'use strict';
  var SIZE = 20;
  var CORNERS = [
    [0, 0],
    [0, 19],
    [19, 0],
    [19, 19],
  ];
  var RAW = [
    [[0, 0]],
    [
      [0, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [1, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [0, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
    ],
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
    ],
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [3, 1],
    ],
    [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 0],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 1],
      [2, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 0],
      [2, 1],
    ],
    [
      [0, 0],
      [1, 0],
      [2, 0],
      [2, 1],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 1],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
  ];

  function normalize(cells) {
    var minR = Infinity,
      minC = Infinity,
      i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i][0] < minR) minR = cells[i][0];
      if (cells[i][1] < minC) minC = cells[i][1];
    }
    var out = cells.map(function (c) {
      return [c[0] - minR, c[1] - minC];
    });
    out.sort(function (a, b) {
      return a[0] - b[0] || a[1] - b[1];
    });
    return out;
  }
  function keyOf(cells) {
    return normalize(cells)
      .map(function (c) {
        return c[0] + ',' + c[1];
      })
      .join('|');
  }
  function rotate(cells) {
    return normalize(
      cells.map(function (c) {
        return [c[1], 5 - c[0]];
      })
    );
  }
  function reflect(cells) {
    return normalize(
      cells.map(function (c) {
        return [c[0], 5 - c[1]];
      })
    );
  }

  var cache = {};
  function orientations(pieceId) {
    if (cache[pieceId]) return cache[pieceId];
    var seen = {},
      out = [];
    var cur = normalize(RAW[pieceId]);
    for (var rot = 0; rot < 4; rot++) {
      var flips = [false, true];
      for (var f = 0; f < 2; f++) {
        var cand = flips[f] ? reflect(cur) : cur;
        var k = keyOf(cand);
        if (!seen[k]) {
          seen[k] = true;
          out.push(cand);
        }
      }
      cur = rotate(cur);
    }
    cache[pieceId] = out;
    return out;
  }

  function orientedCells(pieceId, rot) {
    var all = orientations(pieceId);
    return all[rot % all.length];
  }

  function validateMove(state, seat, move) {
    var hand = state.hands[seat];
    if (hand.indexOf(move.piece) < 0) return 'You already placed that piece.';
    var cells = orientedCells(move.piece, move.rot);
    var touches = false;
    for (var i = 0; i < cells.length; i++) {
      var r = move.r + cells[i][0];
      var c = move.c + cells[i][1];
      if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return 'Piece falls off the board.';
      if (state.grid[r][c] !== 0) return 'Overlap.';
      var EDGES = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ];
      for (var e = 0; e < EDGES.length; e++) {
        var nr = r + EDGES[e][0],
          nc = c + EDGES[e][1];
        if (nr >= 0 && nc >= 0 && nr < SIZE && nc < SIZE && state.grid[nr][nc] === seat + 1)
          return 'Pieces may touch only corner-to-corner.';
      }
      var DIAGS = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ];
      for (var d = 0; d < DIAGS.length; d++) {
        var ar = r + DIAGS[d][0],
          ac = c + DIAGS[d][1];
        if (ar >= 0 && ac >= 0 && ar < SIZE && ac < SIZE && state.grid[ar][ac] === seat + 1)
          touches = true;
      }
      if (state.placements[seat] === 0 && r === CORNERS[seat][0] && c === CORNERS[seat][1])
        touches = true;
    }
    if (!touches) {
      return state.placements[seat] === 0
        ? 'Your first piece must cover your corner.'
        : 'Pieces must touch your own pieces corner-to-corner.';
    }
    return null;
  }

  /** All legal (piece, rot, r, c) placements for the seat — for hint UI. */
  function legalPlacements(state, seat) {
    var out = [];
    var hand = state.hands[seat];
    for (var h = 0; h < hand.length; h++) {
      var piece = hand[h];
      var ors = orientations(piece);
      for (var rot = 0; rot < ors.length; rot++) {
        var cells = ors[rot];
        var maxR = 0,
          maxC = 0,
          i;
        for (i = 0; i < cells.length; i++) {
          if (cells[i][0] > maxR) maxR = cells[i][0];
          if (cells[i][1] > maxC) maxC = cells[i][1];
        }
        for (var r = -maxR; r < SIZE; r++) {
          for (var c = -maxC; c < SIZE; c++) {
            if (validateMove(state, seat, { piece: piece, rot: rot, r: r, c: c }) === null)
              out.push({ piece: piece, rot: rot, r: r, c: c });
          }
        }
      }
    }
    return out;
  }

  function hasAnyMove(state, seat) {
    var hand = state.hands[seat];
    for (var h = 0; h < hand.length; h++) {
      var piece = hand[h];
      var cells0 = orientedCells(piece, 0);
      var maxR = 0,
        maxC = 0,
        i;
      for (i = 0; i < cells0.length; i++) {
        if (cells0[i][0] > maxR) maxR = cells0[i][0];
        if (cells0[i][1] > maxC) maxC = cells0[i][1];
      }
      for (var r = -maxR; r < SIZE; r++)
        for (var c = -maxC; c < SIZE; c++)
          if (validateMove(state, seat, { piece: piece, rot: 0, r: r, c: c }) === null) return true;
    }
    return false;
  }

  window.BLKCORE = {
    SIZE: SIZE,
    PIECES: 21,
    orientations: orientations,
    orientedCells: orientedCells,
    validateMove: validateMove,
    hasAnyMove: hasAnyMove,
    legalPlacements: legalPlacements,
  };
})();
