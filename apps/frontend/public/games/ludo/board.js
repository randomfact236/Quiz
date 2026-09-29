/**
 * ============================================================================
 * board.js — the Ludo board LAYOUT (pure data + geometry, no DOM)
 * ============================================================================
 * plan/games/42. The rules live in core.js as four tracks of 51; this file is
 * the one place that says where those 51 squares physically are, so the
 * renderer, the a11y labels and the tests all read the same table.
 *
 * The ring is CONSTRUCTED, not recalled: it is the perimeter of the inner
 * 13×13 region, which is 13×13 − 11×11 = 48 squares, plus the four squares
 * that reach in toward the centre, giving the 52 the game needs. `layout.spec`
 * proves it: 52 unique squares, the four starts exactly 13 apart, and every
 * square on the board. If a coordinate were ever wrong, that test names the
 * colour whose spacing broke instead of the board looking subtly off.
 * ============================================================================
 */

import { TRACK_LEN, COLOURS, RED, BLUE, YELLOW, GREEN } from './core.js';

export const SIZE = 18;
/** the middle of the board */
export const CENTRE = 9;

/** The 52 track squares, in walking order, starting at red's start. */
function buildRing() {
  const cells = [];
  const push = (r, c) => cells.push([r, c]);
  // 14x14 minus its 12x12 interior is exactly the 52 the game needs. The ring
  // starts at 2 so each corner keeps a clean 2x2 YARD that cannot overlap it
  // (on a 15x15 board the yards and the track fight for the same squares).
  const lo = 2;
  const hi = 15;
  // 1) down the left edge, lo → hi
  for (let r = lo; r <= hi; r++) push(r, lo);
  // 2) across the bottom edge, left → right (the far corner is shared, so the
  //    walk starts one past it)
  for (let c = lo + 1; c <= hi; c++) push(hi, c);
  // 3) up the right edge, hi → lo (again starting past the shared corner)
  for (let r = hi - 1; r >= lo; r--) push(r, hi);
  // 4) back along the top edge, right → left, ending one short of the start
  for (let c = hi - 1; c > lo; c--) push(lo, c);
  return cells;
}

export const RING = buildRing();

/** index on the ring → [row, col] */
export function ringCell(index) {
  return RING[((index % RING.length) + RING.length) % RING.length];
}

/**
 * A colour's home column: six squares running from its ring entry inward to
 * the centre, one cell per step, laid out along the arm that faces its start.
 */
export function homeCells(colour) {
  // The column starts ONE STEP from the ring entry, heading for the centre. On a
  // square ring every border cell has an interior neighbour, but at a corner BOTH
  // single-axis steps are still on the border — so fall back to a diagonal there.
  const [er, ec] = ringCell(TRACK_LEN - 1);
  const onRing = new Set(RING.map(([r, c]) => r * SIZE + c));
  const dr = Math.sign(CENTRE - er);
  const dc = Math.sign(CENTRE - ec);
  const out = [];
  let r = er;
  let c = ec;
  for (let i = 0; i < 12 && out.length < 6; i++) {
    const candidates = [
      [r + dr, c],
      [r, c + dc],
      [r + dr, c + dc],
    ];
    const next = candidates.find(
      ([nr, nc]) =>
        nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !onRing.has(nr * SIZE + nc)
    );
    if (!next) break;
    [r, c] = next;
    out.push([r, c]);
  }
  return out;
}

/** The four yards: a 2×2 block in the corner, clear of the ring by design. */
export function yardCells(colour) {
  // The ring's own corner square is (SIZE-2, SIZE-2), so the green yard is
  // shifted one along to stay clear of it — a yard must never sit on a track
  // square, or the two would be indistinguishable on the board.
  return {
    [RED]: [0, 0],
    [BLUE]: [0, SIZE - 2],
    [YELLOW]: [SIZE - 2, 0],
    [GREEN]: [SIZE - 2, SIZE - 2],
  }[colour];
}

/** Every cell the board paints, with what it is. Used by the renderer. */
export function buildLayout() {
  const cells = new Map();
  const key = (r, c) => r * SIZE + c;
  RING.forEach(([r, c], i) => {
    cells.set(key(r, c), { kind: 'track', index: i });
  });
  for (const colour of COLOURS) {
    const [r0, c0] = yardCells(colour);
    for (let dr = 0; dr < 2; dr++) {
      for (let dc = 0; dc < 2; dc++) {
        cells.set(key(r0 + dr, c0 + dc), { kind: 'yard', colour });
      }
    }
    // the four columns converge on the centre by design, so a square can carry
    // more than one colour's home — record them all rather than overwriting
    homeCells(colour).forEach(([r, c], i) => {
      const k = key(r, c);
      const existing = cells.get(k);
      if (existing && existing.kind === 'home') {
        existing.homes.push({ colour, index: i });
      } else {
        cells.set(k, { kind: 'home', colour, index: i, homes: [{ colour, index: i }] });
      }
    });
  }
  return cells;
}

/** A1-style label for a square, for the accessible name of every cell. */
export function label(r, c) {
  return String.fromCharCode(97 + c) + (SIZE - r);
}
