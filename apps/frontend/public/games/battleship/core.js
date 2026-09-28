/**
 * ============================================================================
 * core.js — Battleship Lite (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/04-battleship.md. Same split as the rest of the family: the pure
 * model lives here (jest suite: src/__tests__/games-battleship-core.test.ts),
 * game.js is the UI shell, the duel backend mirrors it server-side in TS.
 *
 * The fleet is PLAYER-CREATED (plan §4: no pre-filled data — the only
 * "content" in the game is what you place). 8×8 waters, three ships of
 * lengths 4 / 3 / 2, straight, no overlap, in-bounds. Battle alternates one
 * shot each (no "hit and fire again"): a shot answers hit / miss, and the
 * length of a ship when it sinks. Sink all three to win.
 * ============================================================================
 */

export const SIZE = 8;
export const CELLS = SIZE * SIZE;
export const FLEET = [4, 3, 2]; // ship lengths, in placement order
export const HITS = 1; // shots: 0 free | 1 hit

export const rowCol = (cell) => ({ row: Math.floor(cell / SIZE), col: cell % SIZE });
export const cellOf = (row, col) => row * SIZE + col;

/** A fresh empty board state. */
export function createState() {
  return {
    /** my fleet: array of { cells: number[] } in FLEET order */
    fleet: [null, null, null],
    /** shots I have fired at the enemy: Uint8Array (0 none | 1 hit) */
    shots: new Uint8Array(CELLS),
    /** shots fired at MY waters by the enemy: Uint8Array (0 none | 1 miss | 2 hit) */
    enemyShots: new Uint8Array(CELLS), // 0 none | 1 miss | 2 hit
    /** index of the ship currently being placed (-1 = done) */
    placing: 0,
    orientation: 'h', // 'h' | 'v'
    phase: 'placing', // 'placing' | 'battle' | 'finished'
    turn: 1, // 1 = red (creator, opens), 2 = blue
    winner: 0, // 0 none/draw | 1 | 2
  };
}

/* ---- placement --------------------------------------------------------------- */

/** The cells a ship of `length` would occupy at `cell`, horizontal or vertical. */
export function shipCells(cell, length, orientation) {
  const { row, col } = rowCol(cell);
  const out = [];
  for (let i = 0; i < length; i++) {
    if (orientation === 'h') out.push(cellOf(row, col + i));
    else out.push(cellOf(row + i, col));
  }
  return out;
}

/** Is a straight run in bounds, contiguous and clear of the placed ships? */
export function isLegalPlacement(fleet, index, cell, orientation) {
  const length = FLEET[index];
  if (length === undefined) return false;
  const cells = shipCells(cell, length, orientation);
  const { row, col } = rowCol(cell);
  if (orientation === 'h' && col + length > SIZE) return false;
  if (orientation === 'v' && row + length > SIZE) return false;
  for (const c of cells) {
    if (c < 0 || c >= CELLS) return false;
    for (const ship of fleet) {
      if (ship && ship.cells.includes(c)) return false;
    }
  }
  return true;
}

/** Place (or move) the current ship — returns a new state or null when illegal. */
export function placeShip(state, index, cell, orientation = state.orientation) {
  if (!isLegalPlacement(state.fleet, index, cell, orientation)) return null;
  const fleet = state.fleet.slice();
  fleet[index] = { cells: shipCells(cell, FLEET[index], orientation) };
  return { ...state, fleet, orientation };
}

/** All cells the fleet occupies (for rendering). */
export function fleetCells(fleet) {
  const out = new Set();
  for (const ship of fleet) if (ship) for (const c of ship.cells) out.add(c);
  return out;
}

/** A legal random placement (the player's own "quick fleet" button). */
export function randomFleet(rand = Math.random) {
  const fleet = [null, null, null];
  for (let i = 0; i < FLEET.length; i++) {
    for (let tries = 0; tries < 200; tries++) {
      const cell = Math.floor(rand() * CELLS);
      const orientation = rand() < 0.5 ? 'h' : 'v';
      if (isLegalPlacement(fleet, i, cell, orientation)) {
        fleet[i] = { cells: shipCells(cell, FLEET[i], orientation) };
        break;
      }
    }
  }
  return fleet;
}

export function fleetComplete(fleet) {
  return fleet.every((ship) => ship !== null);
}

/* ---- battle ------------------------------------------------------------------ */

/** Answer a shot at MY waters: { result: 'miss' | 'hit', sunk: length | null } */
export function resolveShot(fleet, shots, cell) {
  if (cell < 0 || cell >= CELLS || shots[cell] !== 0) {
    return { result: 'invalid', sunk: null };
  }
  const ship = fleet.find((s) => s && s.cells.includes(cell));
  if (!ship) return { result: 'miss', sunk: null };
  const sunk = ship.cells.every((c) => shots[c] === HITS || c === cell) ? ship.cells.length : null;
  return { result: 'hit', sunk };
}

/** Record a shot I fired at the enemy waters (mutates nothing; returns a new shots array). */
export function fire(shots, cell) {
  if (cell < 0 || cell >= CELLS || shots[cell] !== 0) return null;
  const next = Uint8Array.from(shots);
  next[cell] = HITS; // 1 = I hit something of theirs
  return next;
}

/** Which of MY ships are fully hit by the enemy's shots. */
export function sunkShips(fleet, enemyShots) {
  return fleet
    .map((ship, i) => (ship && ship.cells.every((c) => enemyShots[c] === HITS) ? i : -1))
    .filter((i) => i !== -1);
}

export function allSunk(fleet, enemyShots) {
  return fleet.every((ship) => ship && ship.cells.every((c) => enemyShots[c] === HITS));
}

/* ---- AI targeting ------------------------------------------------------------- */

/** Neighbour cells of a cell (4-way, in-bounds). */
function neighbours(cell) {
  const { row, col } = rowCol(cell);
  const out = [];
  if (row > 0) out.push(cell - SIZE);
  if (row < SIZE - 1) out.push(cell + SIZE);
  if (col > 0) out.push(cell - 1);
  if (col < SIZE - 1) out.push(cell + 1);
  return out;
}

/** Easy AI — uniform random unfired cell. */
export function easyTarget(shots) {
  const free = [];
  for (let c = 0; c < CELLS; c++) if (shots[c] === 0) free.push(c);
  if (free.length === 0) return -1;
  return free[Math.floor(Math.random() * free.length)];
}

/** Medium AI — hunt: probe around known hits, else random. */
export function mediumTarget(shots) {
  const free = [];
  for (let c = 0; c < CELLS; c++) if (shots[c] === 0) free.push(c);
  if (free.length === 0) return -1;
  const freeSet = new Set(free);
  const hits = [];
  for (let c = 0; c < CELLS; c++) if (shots[c] === HITS) hits.push(c);
  for (const hit of hits) {
    for (const n of neighbours(hit)) if (freeSet.has(n)) return n;
  }
  return free[Math.floor(Math.random() * free.length)];
}

/** Hard AI — hunt, finish ships, then a parity sweep. */
export function hardTarget(shots, enemyFleet) {
  const free = [];
  for (let c = 0; c < CELLS; c++) if (shots[c] === 0) free.push(c);
  if (free.length === 0) return -1;
  const freeSet = new Set(free);

  // 1. take the shot that sinks a ship we can still see (solo: the computer
  //    knows the waters — using it is what makes the hard tier feel sharp)
  if (enemyFleet) {
    for (const ship of enemyFleet) {
      if (!ship) continue;
      const open = ship.cells.filter((c) => shots[c] === 0);
      if (open.length === 1) return open[0];
    }
  }
  // 2. hunt: probe any unfired neighbour of a hit
  for (let c = 0; c < CELLS; c++) {
    if (shots[c] !== HITS) continue;
    for (const n of neighbours(c)) if (freeSet.has(n)) return n;
  }
  // 3. parity sweep: every ship of length ≥ 2 covers a cell of each parity
  const parity = [];
  for (const c of free) {
    const { row, col } = rowCol(c);
    if ((row + col) % 2 === 0) parity.push(c);
  }
  if (parity.length > 0) return parity[Math.floor(Math.random() * parity.length)];
  return free[Math.floor(Math.random() * free.length)];
}

export function aiTarget(shots, enemyFleet, difficulty) {
  if (difficulty === 'hard') return hardTarget(shots, enemyFleet);
  if (difficulty === 'medium') return mediumTarget(shots, enemyFleet);
  return easyTarget(shots, enemyFleet);
}
