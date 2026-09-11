/**
 * ============================================================================
 * Word Puzzle — core.js (Game 04, plan/games/04-word-puzzle.md §3/§6)
 * ============================================================================
 * Pure model, zero DOM access — this module is the test surface (plan §8).
 * Plain ESM, no build step (same convention as games 01/02/03): game.js
 * imports it in the browser, and the jest suite
 * (src/__tests__/games-word-puzzle.test.ts) plus the folder's own
 * core.test.html harness import it directly.
 *
 * The grid is an Array(size) of row strings; row 0 is the top. Words ship
 * uppercase in data/themes.json (schema §5) and are normalized to lowercase
 * here — the plan's §2 "lowercase" and §5 uppercase examples both land on
 * case-insensitive comparisons everywhere.
 * ============================================================================
 */

export const PROGRESS_KEY = 'game:word-puzzle:progress';
export const PREFS_KEY = 'game:word-puzzle:prefs';

export const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** The 8 direction vectors as [rowDelta, colDelta]; row 0 is the top. */
export const DIRS = {
  E: [0, 1],
  S: [1, 0],
  SE: [1, 1],
  NE: [-1, 1],
  W: [0, -1],
  N: [-1, 0],
  NW: [-1, -1],
  SW: [1, -1],
};

/** Placement directions per grid tier (plan §2): L1 → ↓ · L2 adds ↘ ↗ · L3 all 8. */
export const TIER_DIRS = {
  1: ['E', 'S'],
  2: ['E', 'S', 'SE', 'NE'],
  3: ['E', 'S', 'SE', 'NE', 'W', 'N', 'NW', 'SW'],
};

/** Grid size → tier. Only the shipped tiers 8/10/12 are mapped. */
export const TIER_BY_SIZE = { 8: 1, 10: 2, 12: 3 };

export function tierDirs(size) {
  return TIER_DIRS[TIER_BY_SIZE[size] || 3];
}

/** Reversed reading (a drag opposite to the placement) validates on L3 only. */
export function reverseAllowed(size) {
  return (TIER_BY_SIZE[size] || 3) === 3;
}

/**
 * Deterministic 32-bit rng (mulberry32, same stream as game 03). A fixed
 * seed regenerates the exact same grid — the daily puzzle (P3) is built on
 * this, and the tests rely on it.
 */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Place every word of `level` into a fresh size×size grid (plan §3):
 * longest-first, each word gets up to 200 random placements (random tier
 * direction + random start cell); a placement is legal when in bounds and
 * every touched cell is empty or holds the same letter (shared-letter
 * crossings allowed). A word that exhausts its attempts restarts the whole
 * level — after 20 restarts it throws (data bug, must never ship). Empty
 * cells are then filled 60 % from the level's own letters, 40 % uniform
 * A–Z. Returns `{ grid, placements, seed }`; the input is never mutated.
 */
export function generateLevel(level, seed) {
  const size = level.size;
  const dirs = tierDirs(size);
  const words = [...level.words].map((w) => String(w).toLowerCase());
  words.sort((a, b) => b.length - a.length); // longest first (stable sort)
  const rng = mulberry32(seed);

  for (let restart = 0; restart < 20; restart++) {
    const cells = Array.from({ length: size }, () => new Array(size).fill(''));
    const placements = [];
    let complete = true;

    for (const word of words) {
      let placed = false;
      for (let attempt = 0; attempt < 200 && !placed; attempt++) {
        const dir = dirs[Math.floor(rng() * dirs.length)];
        const [dr, dc] = DIRS[dir];
        // Random start cell, constrained so the word ends in bounds.
        const rowMin = dr < 0 ? word.length - 1 : 0;
        const rowMax = dr > 0 ? size - word.length : size - 1;
        const colMin = dc < 0 ? word.length - 1 : 0;
        const colMax = dc > 0 ? size - word.length : size - 1;
        if (rowMax < rowMin || colMax < colMin) continue; // word cannot fit this tier
        const row = rowMin + Math.floor(rng() * (rowMax - rowMin + 1));
        const col = colMin + Math.floor(rng() * (colMax - colMin + 1));
        let legal = true;
        for (let i = 0; i < word.length; i++) {
          const ch = cells[row + dr * i][col + dc * i];
          if (ch !== '' && ch !== word[i]) {
            legal = false;
            break;
          }
        }
        if (!legal) continue;
        for (let i = 0; i < word.length; i++) cells[row + dr * i][col + dc * i] = word[i];
        placements.push({ word, row, col, dir });
        placed = true;
      }
      if (!placed) {
        complete = false;
        break;
      }
    }
    if (!complete) continue;

    // Filler: 60 % weighted toward the level's own letters, 40 % uniform.
    const bag = words.join('');
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (cells[r][c] === '') {
          cells[r][c] =
            rng() < 0.6 ? bag[Math.floor(rng() * bag.length)] : LETTERS[Math.floor(rng() * 26)];
        }
      }
    }
    return { grid: cells.map((row) => row.join('')), placements, seed };
  }
  throw new Error(
    'generateLevel: no placement after 20 restarts (size ' +
      size +
      ', words: ' +
      words.join(',') +
      ')'
  );
}

/**
 * The straight cell line from `start` to `end` (both {row, col}), inclusive
 * — or null when either end is out of bounds or the points are not on one
 * of the 8 direction lines (including the degenerate single cell, which is
 * returned as [start]: harmless, never matches a 4+ letter word).
 */
export function lineCells(grid, start, end) {
  const n = grid.length;
  const inBounds = (p) => p && p.row >= 0 && p.row < n && p.col >= 0 && p.col < n;
  if (!inBounds(start) || !inBounds(end)) return null;
  const dr = end.row - start.row;
  const dc = end.col - start.col;
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;
  const steps = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr);
  const sc = Math.sign(dc);
  const cells = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + sr * i, col: start.col + sc * i });
  }
  return cells;
}

/** The letters at `cells` (as from lineCells) read start → end. */
export function lettersAt(grid, cells) {
  return cells.map((c) => grid[c.row][c.col]).join('');
}

/** Case-insensitive match; the reversed reading only when `allowReverse`. */
export function matchesWord(letters, word, allowReverse) {
  const a = letters.toLowerCase();
  const b = String(word).toLowerCase();
  if (a === b) return true;
  if (!allowReverse) return false;
  let rev = '';
  for (let i = b.length - 1; i >= 0; i--) rev += b[i];
  return a === rev;
}

/**
 * ⭐ finish the level · ⭐ time ≤ par · ⭐ no hints and at most 2 wrong
 * picks (plan §2). Boundary rule: a time exactly on par still earns the
 * speed star; a third wrong pick or a single hint drops the clean star.
 */
export function starsFor(parSec, timeSec, hintsUsed, wrongPicks) {
  let stars = 1;
  if (timeSec <= parSec) stars++;
  if (hintsUsed === 0 && wrongPicks <= 2) stars++;
  return stars;
}

/** m:ss clock shared by the HUD, result overlay and share text. */
export function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(total / 60) + ':' + String(total % 60).padStart(2, '0');
}

/**
 * Data lint for data/themes.json (plan §9 P1): 4–9 letters, A–Z only, no
 * duplicates within a level, tier grid sizes/word counts. Returns an array
 * of human-readable problems — empty when the data is shippable.
 */
export function lintThemes(themes) {
  const tiers = [
    { size: 8, count: 5 },
    { size: 10, count: 7 },
    { size: 12, count: 10 },
  ];
  const errors = [];
  if (!themes || !Array.isArray(themes.themes) || themes.themes.length === 0) {
    return ['themes.themes must be a non-empty array'];
  }
  themes.themes.forEach((theme, t) => {
    const label = theme && theme.id ? theme.id : 'theme #' + t;
    if (!theme.id || !theme.name || !theme.emoji)
      errors.push(label + ': id, name and emoji are required');
    if (!Array.isArray(theme.levels) || theme.levels.length !== 3) {
      errors.push(label + ': must ship exactly 3 levels');
      return;
    }
    theme.levels.forEach((level, i) => {
      const tier = tiers[i];
      const ll = label + ' L' + (i + 1);
      if (level.size !== tier.size)
        errors.push(ll + ': size must be ' + tier.size + ', got ' + level.size);
      if (!Array.isArray(level.words) || level.words.length !== tier.count) {
        errors.push(ll + ': must ship exactly ' + tier.count + ' words');
        return;
      }
      if (typeof level.parSec !== 'number' || level.parSec <= 0)
        errors.push(ll + ': parSec must be a positive number');
      const seen = new Set();
      for (const raw of level.words) {
        const word = String(raw);
        if (!/^[a-zA-Z]{4,9}$/.test(word)) {
          errors.push(ll + ': "' + word + '" must be 4–9 letters A–Z, no spaces');
          continue;
        }
        const key = word.toLowerCase();
        if (seen.has(key)) errors.push(ll + ': duplicate word "' + word + '"');
        seen.add(key);
        if (word.length > level.size) errors.push(ll + ': "' + word + '" is longer than the grid');
      }
    });
  });
  return errors;
}
