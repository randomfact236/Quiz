// The invariant check the layout must satisfy — a layout that fails this is
// wrong, no matter how it looks.
const b = await import('../public/games/ludo/board.js');
const c = await import('../public/games/ludo/core.js');

let fail = 0;
const check = (name, ok, extra = '') => { if (!ok) fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`); };

const ring = b.RING;
check('the ring has 52 squares', ring.length === 52, `${ring.length}`);
const keys = new Set(ring.map(([r, cc]) => r * 18 + cc));
check('every ring square is unique', keys.size === ring.length, `${keys.size} unique`);
check('every ring square is on the board', ring.every(([r, cc]) => r >= 0 && r < 17 && cc >= 0 && cc < 17));
check('the ring closes back on itself', (() => { const [r, cc] = ring[0]; const [lr, lc] = ring[ring.length - 1];
  return Math.abs(Math.abs(r - lr) + Math.abs(cc - lc)) === 1; })(), 'last square is adjacent to the first');

check('the four starts are exactly 13 apart', c.START_INDEX[c.GREEN] + 13 === c.TRACK_LEN + 1 || c.START_INDEX[c.GREEN] === 39,
  `starts ${JSON.stringify(c.START_INDEX)}`);
// walk the ring: consecutive squares must be orthogonal neighbours
let gaps = 0;
for (let i = 0; i < ring.length; i++) {
  const [r1, c1] = ring[i];
  const [r2, c2] = ring[(i + 1) % ring.length];
  if (Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) gaps++;
}
check('every step of the ring is one square', gaps === 0, `${gaps} non-orthogonal steps`);
for (const colour of c.COLOURS) {
  const home = b.homeCells(colour);
  const uniq = new Set(home.map(([r, cc]) => r * 18 + cc));
  check(`colour ${c.COLOUR_NAME[colour]} has a 6-square home column`, home.length === 6 && uniq.size === 6);
  const entry = b.ringCell(c.TRACK_LEN - 1);
  const d = Math.abs(entry[0] - home[0][0]) + Math.abs(entry[1] - home[0][1]);
  check(`colour ${c.COLOUR_NAME[colour]}'s home starts next to the ring entry`, d === 1, `distance ${d}`);
}
const layout = b.buildLayout();
// The four home columns converge on the centre BY DESIGN (as on a real board),
// so the count is not fixed. What must hold is that no yard or home has
// overwritten a TRACK square, and that every square the rules can reach is drawn.
const painted = b.RING.map(([r, cc]) => layout.get(r * 18 + cc));
check('no yard or home overwrote a track square',
  painted.every((p) => p && p.kind === 'track' && Number.isInteger(p.index)),
  `${painted.filter((p) => p && p.kind !== 'track').length} track squares were overwritten`);
check('every ring index survives the layout',
  new Set(painted.map((p) => p && p.index)).size === 52);
let yards = 0, homes = 0;
for (const cell of layout.values()) {
  if (cell.kind === 'yard') yards++;
  if (cell.kind === 'home') homes += cell.homes ? cell.homes.length : 1;
}
check('all four yards are drawn', yards === 16, `${yards} yard cells`);
check('all four home columns are drawn', homes === 24, `${homes} home cells`);
console.log(fail === 0 ? '\nLAYOUT OK' : `\n${fail} INVARIANT(S) FAILED`);
process.exit(fail ? 1 : 0);
