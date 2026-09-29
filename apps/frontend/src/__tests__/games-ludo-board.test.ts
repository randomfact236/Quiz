import { RING, SIZE, ringCell, homeCells, buildLayout } from '../../public/games/ludo/board.js';
import { TRACK_LEN, COLOURS, COLOUR_NAME } from '../../public/games/ludo/core.js';

/**
 * plan/games/42 — the board LAYOUT's invariants.
 *
 * The layout is the one piece of Ludo that cannot be written by reasoning
 * alone: a 52-square ring has to fit the board, hit the right spacing, and
 * not collide with the yards or the home columns. These checks caught the
 * first three attempts — a 48-square ring, yards sitting on track squares,
 * and home columns that never left the ring — so a wrong coordinate fails
 * here by name instead of reaching the screen as a subtly misshapen board.
 */
describe('ludo board layout', () => {
  it('is a valid, non-overlapping board', () => {
    const problems: string[] = [];
    const check = (ok: boolean, message: string) => {
      if (!ok) problems.push(message);
    };

    check(RING.length === 52, `the ring has ${RING.length} squares, not 52`);
    check(new Set(RING.map(([r, c]) => r * SIZE + c)).size === RING.length, 'the ring repeats a square');
    check(
      RING.every(([r, c]) => r >= 0 && r < SIZE && c >= 0 && c < SIZE),
      'the ring leaves the board'
    );

    // every step of the ring is one square, and the loop closes on itself
    let gaps = 0;
    for (let i = 0; i < RING.length; i++) {
      const [r1, c1] = RING[i];
      const [r2, c2] = RING[(i + 1) % RING.length];
      if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) gaps++;
    }
    check(gaps === 0, `${gaps} steps of the ring are not single squares`);

    for (const colour of COLOURS) {
      const home = homeCells(colour);
      check(home.length === 6, `${COLOUR_NAME[colour]} home has ${home.length} squares`);
      check(
        new Set(home.map(([r, c]) => r * SIZE + c)).size === home.length,
        `${COLOUR_NAME[colour]} home repeats a square`
      );
      const entry = ringCell(TRACK_LEN - 1);
      const distance = Math.abs(entry[0] - home[0][0]) + Math.abs(entry[1] - home[0][1]);
      check(distance === 1, `${COLOUR_NAME[colour]} home starts ${distance} squares from the ring entry`);
    }

    const layout = buildLayout();
    const painted = RING.map(([r, c]) => layout.get(r * SIZE + c));
    check(
      painted.every((p) => p && p.kind === 'track' && Number.isInteger(p.index)),
      'a yard or home overwrote a track square'
    );
    check(new Set(painted.map((p) => p && p.index)).size === 52, 'the layout lost a ring index');

    let yards = 0;
    let homes = 0;
    for (const cell of layout.values()) {
      if (cell.kind === 'yard') yards++;
      if (cell.kind === 'home') homes += cell.homes ? cell.homes.length : 1;
    }
    check(yards === 16, `drew ${yards} yard squares, expected 16`);
    check(homes === 24, `drew ${homes} home squares, expected 24`);

    expect(problems).toEqual([]);
  });
});
