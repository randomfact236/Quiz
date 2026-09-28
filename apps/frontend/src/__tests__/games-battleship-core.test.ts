import {
  SIZE,
  CELLS,
  FLEET,
  HITS,
  createState,
  rowCol,
  cellOf,
  shipCells,
  isLegalPlacement,
  placeShip,
  fleetCells,
  randomFleet,
  fleetComplete,
  resolveShot,
  fire,
  sunkShips,
  allSunk,
  easyTarget,
  mediumTarget,
  hardTarget,
  aiTarget,
} from '../../public/games/battleship/core.js';

/**
 * plan/games/04 — the pure Battleship model: player-made fleet placement
 * legality, shot resolution with sunk detection, and the three AI targeting
 * tiers. The mirror of the other games' core suites.
 */
describe('battleship core', () => {
  const fleetFor = (rows: number[][]) =>
    rows.map((cells) => ({ cells: cells.map(([r, c]) => cellOf(r, c)) }));

  it('ships an 8×8 board and a 4/3/2 fleet', () => {
    expect(SIZE).toBe(8);
    expect(CELLS).toBe(64);
    expect(FLEET).toEqual([4, 3, 2]);
  });

  it('maps cells to rows/cols and back', () => {
    expect(rowCol(17)).toEqual({ row: 2, col: 1 });
    expect(cellOf(2, 1)).toBe(17);
  });

  it('builds straight ship cells horizontally and vertically', () => {
    expect(shipCells(cellOf(2, 1), 3, 'h')).toEqual([cellOf(2, 1), cellOf(2, 2), cellOf(2, 3)]);
    expect(shipCells(cellOf(2, 1), 3, 'v')).toEqual([cellOf(2, 1), cellOf(3, 1), cellOf(4, 1)]);
  });

  it('rejects out-of-bounds, overlapping and duplicate placements', () => {
    const fleet = [null, null, null];
    // off the right edge (horizontal length 4 from col 7)
    expect(isLegalPlacement(fleet, 0, cellOf(0, 7), 'h')).toBe(false);
    // off the bottom (vertical length 4 from row 7)
    expect(isLegalPlacement(fleet, 0, cellOf(7, 0), 'v')).toBe(false);
    // the empty board accepts a middle placement
    expect(isLegalPlacement(fleet, 0, cellOf(2, 2), 'h')).toBe(true);
    const placed = [null, null, null];
    placed[0] = { cells: shipCells(cellOf(2, 2), 4, 'h') };
    // overlapping the placed ship
    expect(isLegalPlacement(placed, 1, cellOf(2, 4), 'h')).toBe(false);
    // adjacent (not overlapping) is fine
    expect(isLegalPlacement(placed, 1, cellOf(3, 2), 'h')).toBe(true);
  });

  it('places ships into the state and tracks the fleet cells', () => {
    let state = createState();
    const placed = placeShip(state, 0, cellOf(0, 0), 'h');
    expect(placed).not.toBeNull();
    state = placed!;
    expect(fleetCells(state.fleet).size).toBe(4);
    expect(state.phase).toBe('placing');
    // an illegal placement is rejected without mutating
    expect(placeShip(state, 1, cellOf(0, 2), 'h')).toBeNull();
  });

  it('randomFleet always produces a legal, complete fleet', () => {
    for (let n = 0; n < 20; n++) {
      const fleet = randomFleet();
      expect(fleetComplete(fleet)).toBe(true);
      for (let i = 0; i < FLEET.length; i++) {
        const cells = fleet[i].cells;
        expect(cells).toHaveLength(FLEET[i]);
        for (const c of cells) {
          expect(c).toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThan(CELLS);
        }
      }
      // no overlaps between ships
      const all = fleet.flatMap((s) => s.cells);
      expect(new Set(all).size).toBe(all.length);
    }
  });

  it('resolves shots: miss, hit, sunk (and rejects repeats)', () => {
    const fleet = fleetFor([
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [4, 0],
        [4, 1],
        [4, 2],
      ],
      [
        [7, 5],
        [7, 6],
      ],
    ]);
    const shots = new Uint8Array(CELLS);

    // miss on open water
    expect(resolveShot(fleet, shots, cellOf(5, 5)).result).toBe('miss');
    // hits register
    expect(resolveShot(fleet, shots, cellOf(0, 0)).result).toBe('hit');
    shots[cellOf(0, 0)] = HITS;
    shots[cellOf(0, 1)] = HITS;
    shots[cellOf(0, 2)] = HITS;
    // the last untouched cell sinks the length-4
    const last = resolveShot(fleet, shots, cellOf(0, 3));
    expect(last.result).toBe('hit');
    expect(last.sunk).toBe(4);
    // re-firing the same cell is invalid
    shots[cellOf(0, 3)] = HITS;
    expect(resolveShot(fleet, shots, cellOf(0, 3)).result).toBe('invalid');
    expect(resolveShot(fleet, shots, 999).result).toBe('invalid');
  });

  it('fire() records my shots once and returns null on repeats', () => {
    const shots = new Uint8Array(CELLS);
    const next = fire(shots, 12);
    expect(next).not.toBeNull();
    expect(next![12]).toBe(HITS);
    expect(shots[12]).toBe(0); // the input is untouched (immutable)
    expect(fire(next!, 12)).toBeNull();
  });

  it('detects sunk ships and the all-sunk win', () => {
    const fleet = fleetFor([
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [4, 0],
        [4, 1],
        [4, 2],
      ],
      [
        [7, 5],
        [7, 6],
      ],
    ]);
    const shots = new Uint8Array(CELLS);
    expect(sunkShips(fleet, shots)).toEqual([]);
    for (const [r, c] of [
      [0, 0],
      [0, 1],
      [0, 2],
      [0, 3],
    ])
      shots[cellOf(r, c)] = HITS;
    expect(sunkShips(fleet, shots)).toEqual([0]);
    expect(allSunk(fleet, shots)).toBe(false);
    for (const [r, c] of [
      [4, 0],
      [4, 1],
      [4, 2],
      [7, 5],
      [7, 6],
    ])
      shots[cellOf(r, c)] = HITS;
    expect(sunkShips(fleet, shots)).toEqual([0, 1, 2]);
    expect(allSunk(fleet, shots)).toBe(true);
  });

  it('every AI tier only returns unfired cells', () => {
    const shots = new Uint8Array(CELLS);
    const fleet = fleetFor([
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [4, 0],
        [4, 1],
        [4, 2],
      ],
      [
        [7, 5],
        [7, 6],
      ],
    ]);
    for (const tier of ['easy', 'medium', 'hard']) {
      const target = aiTarget(shots, fleet, tier);
      expect(target).toBeGreaterThanOrEqual(0);
      expect(target).toBeLessThan(CELLS);
      expect(shots[target]).toBe(0);
    }
    // a full board has no target
    const full = new Uint8Array(CELLS).fill(HITS);
    expect(easyTarget(full)).toBe(-1);
    expect(mediumTarget(full)).toBe(-1);
    expect(hardTarget(full, fleet)).toBe(-1);
  });

  it('medium and hard hunt around a hit instead of firing blind', () => {
    const fleet = fleetFor([
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [4, 0],
        [4, 1],
        [4, 2],
      ],
      [
        [7, 5],
        [7, 6],
      ],
    ]);
    const shots = new Uint8Array(CELLS);
    shots[cellOf(3, 3)] = HITS; // one known hit
    const hunters = [() => mediumTarget(shots), () => hardTarget(shots, fleet)];
    for (const hunt of hunters) {
      for (let n = 0; n < 12; n++) {
        const t = hunt();
        const { row, col } = rowCol(t);
        // must land in the hit's neighbourhood, not blind
        const near = Math.abs(row - 3) + Math.abs(col - 3) <= 2 && shots[t] === 0;
        expect(near).toBe(true);
      }
    }
  });

  it('hard takes the finishing shot when it can see the last open cell', () => {
    const fleet = fleetFor([
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
      [
        [4, 0],
        [4, 1],
        [4, 2],
      ],
      [
        [7, 5],
        [7, 6],
      ],
    ]);
    const shots = new Uint8Array(CELLS);
    // the length-3 ship has exactly one open cell left
    shots[cellOf(4, 0)] = HITS;
    shots[cellOf(4, 1)] = HITS;
    expect(hardTarget(shots, fleet)).toBe(cellOf(4, 2));
  });
});
