/**
 * Ludo MP core — board geometry for rendering (rules live server-side).
 * Token position model: dist -1 yard | 1..51 ring | 52..55 home column | 56 done.
 */
(function () {
  'use strict';
  const RING = 52;

  function ringCell(seat, dist) {
    if (dist < 1 || dist > 51) return null;
    return (seat * 13 + dist - 1) % RING;
  }

  /** Ring cell -> {r,c} on a 15x15 cross board. Standard ludo coordinates. */
  function ringRC(cell) {
    // 52-cell ring laid out on the classic 15x15 cross (6-wide arms).
    const track = [
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
    const rc = track[cell % track.length];
    return { r: rc[0], c: rc[1] };
  }

  /** Home column cell (dist 52..55) -> {r,c}. */
  function homeRC(seat, dist) {
    const step = dist - 52; // 0..3
    if (seat === 0) return { r: 7, c: 1 + step };
    if (seat === 1) return { r: 1 + step, c: 7 };
    if (seat === 2) return { r: 7, c: 13 - step };
    return { r: 13 - step, c: 7 };
  }

  /** Yard anchor per seat (center of each 6x6 yard quadrant). */
  const YARD = [
    { r: 2, c: 2 },
    { r: 2, c: 12 },
    { r: 12, c: 2 },
    { r: 12, c: 12 },
  ];

  const START = [0, 13, 26, 39]; // ring entry per seat

  window.LUDOCORE = { ringCell, ringRC, homeRC, YARD, START, RING };
})();
