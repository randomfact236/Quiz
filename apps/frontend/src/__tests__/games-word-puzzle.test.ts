/**
 * Pure-logic tests for the static game at
 * public/games/word-puzzle/core.js (plan/games/04-word-puzzle.md §8:
 * seeded determinism; every word placed within its tier's directions;
 * lineCells + lettersAt round trip; 100 seeds per shipped level with zero
 * throws; matchesWord exact/reverse/case; starsFor boundary table; data
 * lint). The same assertions ship in the game's own core.test.html harness;
 * this suite keeps them running in CI.
 */
import {
  DIRS,
  LETTERS,
  PREFS_KEY,
  PROGRESS_KEY,
  TIER_BY_SIZE,
  TIER_DIRS,
  formatTime,
  generateLevel,
  lettersAt,
  lineCells,
  lintThemes,
  matchesWord,
  mulberry32,
  reverseAllowed,
  starsFor,
  tierDirs,
} from '../../public/games/word-puzzle/core';
import THEMES from '../../public/games/word-puzzle/data/themes.json';

const ALL_LEVELS: {
  theme: string;
  level: number;
  size: number;
  words: string[];
  levelData: (typeof THEMES.themes)[number]['levels'][number];
}[] = THEMES.themes.flatMap((t) =>
  t.levels.map((l, i) => ({
    theme: t.id,
    level: i + 1,
    size: l.size,
    words: l.words,
    levelData: l,
  }))
);

describe('data/themes.json (shipped content)', () => {
  it('lints clean — 4 themes × 3 tiers, word counts, charset, dupes', () => {
    expect(THEMES.themes).toHaveLength(4);
    expect(lintThemes(THEMES)).toEqual([]);
  });

  it('every word is 4–9 letters and fits its grid row/column span', () => {
    for (const { size, words } of ALL_LEVELS) {
      for (const w of words) {
        expect(w).toMatch(/^[A-Z]{4,9}$/);
        expect(w.length).toBeLessThanOrEqual(size);
      }
    }
  });
});

describe('tier tables', () => {
  it('sizes map to tiers 1/2/3 and directions grow per tier', () => {
    expect(TIER_BY_SIZE).toEqual({ 8: 1, 10: 2, 12: 3 });
    expect(tierDirs(8)).toEqual(['E', 'S']);
    expect(tierDirs(10)).toEqual(['E', 'S', 'SE', 'NE']);
    expect(tierDirs(12)).toHaveLength(8);
    expect(reverseAllowed(8)).toBe(false);
    expect(reverseAllowed(10)).toBe(false);
    expect(reverseAllowed(12)).toBe(true);
  });

  it('the 8 direction vectors are unit steps', () => {
    for (const [dr, dc] of Object.values(DIRS)) {
      expect(Math.max(Math.abs(dr), Math.abs(dc))).toBe(1);
    }
  });
});

describe('lineCells', () => {
  const grid = Array.from({ length: 5 }, () => '.....');
  const s = { row: 2, col: 2 };

  it('walks all 8 directions inclusive of both endpoints', () => {
    expect(lineCells(grid, s, { row: 2, col: 4 })!.map((c) => [c.row, c.col])).toEqual([
      [2, 2],
      [2, 3],
      [2, 4],
    ]);
    expect(lineCells(grid, s, { row: 4, col: 0 })!.map((c) => [c.row, c.col])).toEqual([
      [2, 2],
      [3, 1],
      [4, 0],
    ]); // SW
    expect(lineCells(grid, s, { row: 0, col: 4 })!.map((c) => [c.row, c.col])).toEqual([
      [2, 2],
      [1, 3],
      [0, 4],
    ]); // NE
  });

  it('a single cell is the degenerate line [start]', () => {
    expect(lineCells(grid, s, { row: 2, col: 2 })).toEqual([{ row: 2, col: 2 }]);
  });

  it('returns null for non-collinear points', () => {
    expect(lineCells(grid, s, { row: 3, col: 4 })).toBeNull(); // knight move
    expect(lineCells(grid, s, { row: 1, col: 0 })).toBeNull(); // not 45°
  });

  it('returns null when either end is out of bounds', () => {
    expect(lineCells(grid, s, { row: 2, col: 9 })).toBeNull();
    expect(lineCells(grid, s, { row: -1, col: 2 })).toBeNull();
    expect(lineCells(grid, s, { row: 5, col: 5 })).toBeNull();
  });
});

describe('lettersAt / matchesWord', () => {
  const grid = ['lionx', 'yxzeb', 'zzztq'];

  it('reads cells in order', () => {
    expect(
      lettersAt(grid, [
        { row: 0, col: 0 },
        { row: 0, col: 3 },
      ])
    ).toBe('ln');
    expect(
      lettersAt(grid, [
        { row: 0, col: 3 },
        { row: 1, col: 3 },
        { row: 2, col: 3 },
      ])
    ).toBe('net');
  });

  it('matches exactly and case-insensitively', () => {
    expect(matchesWord('lion', 'lion', false)).toBe(true);
    expect(matchesWord('LION', 'lion', false)).toBe(true);
    expect(matchesWord('li', 'lion', true)).toBe(false); // prefix is not a match
  });

  it('reverse only when allowed, symmetrically', () => {
    expect(matchesWord('noil', 'lion', false)).toBe(false);
    expect(matchesWord('noil', 'lion', true)).toBe(true);
    expect(matchesWord('lion', 'noil', true)).toBe(true);
    expect(matchesWord('cats', 'lion', true)).toBe(false);
  });
});

describe('starsFor (plan §2 boundary table)', () => {
  it('finish star is unconditional', () => {
    expect(starsFor(90, 91, 1, 3)).toBe(1);
    expect(starsFor(90, 100000, 3, 99)).toBe(1);
  });

  it('speed star: time ≤ par, boundary inclusive', () => {
    expect(starsFor(90, 90, 1, 3)).toBe(2); // exactly on par
    expect(starsFor(90, 91, 1, 3)).toBe(1); // par + 1 s
    expect(starsFor(90, 0, 1, 3)).toBe(2);
  });

  it('clean star: no hints AND ≤ 2 wrong picks', () => {
    expect(starsFor(90, 89, 0, 2)).toBe(3); // boundary: 2 wrong picks ok
    expect(starsFor(90, 89, 0, 3)).toBe(2); // 3rd wrong pick drops it
    expect(starsFor(90, 89, 1, 0)).toBe(2); // one hint drops it
    expect(starsFor(90, 90, 0, 0)).toBe(3);
  });
});

describe('generateLevel (plan §3)', () => {
  const level = THEMES.themes[0].levels[0]; // Animals L1, 8×8

  it('same seed → identical grid and placements (snapshot)', () => {
    const a = generateLevel(level, 42);
    const b = generateLevel(level, 42);
    expect(a).toEqual(b);
    expect(a.seed).toBe(42);
  });

  it('different seeds → different grids', () => {
    const a = generateLevel(level, 42);
    const b = generateLevel(level, 43);
    expect(a.grid).not.toEqual(b.grid);
  });

  it('builds a size×size grid of lowercase letters', () => {
    const gen = generateLevel(level, 1);
    expect(gen.grid).toHaveLength(8);
    for (const row of gen.grid) {
      expect(row).toHaveLength(8);
      expect(row).toMatch(new RegExp('^[' + LETTERS + ']{8}$'));
    }
  });

  it('places every word exactly once, within the tier directions', () => {
    const gen = generateLevel(level, 7);
    expect(gen.placements.map((p) => p.word).sort()).toEqual(
      level.words.map((w) => w.toLowerCase()).sort()
    );
    for (const p of gen.placements) {
      expect(TIER_DIRS[1]).toContain(p.dir);
    }
  });

  it('round-trips: lineCells + lettersAt spell every placed word', () => {
    for (const { size, levelData } of ALL_LEVELS) {
      const gen = generateLevel(levelData, 1234);
      const allowRev = reverseAllowed(size);
      for (const p of gen.placements) {
        const [dr, dc] = DIRS[p.dir];
        const start = { row: p.row, col: p.col };
        const end = {
          row: p.row + dr * (p.word.length - 1),
          col: p.col + dc * (p.word.length - 1),
        };
        const cells = lineCells(gen.grid, start, end);
        expect(cells).not.toBeNull();
        const forward = lettersAt(gen.grid, cells!);
        expect(matchesWord(forward, p.word, allowRev)).toBe(true);
        // the reversed drag validates exactly when the tier allows reverse
        const back = lettersAt(gen.grid, lineCells(gen.grid, end, start)!);
        expect(matchesWord(back, p.word, allowRev)).toBe(allowRev);
      }
    }
  });

  it('is deterministic for a fixed rng stream (mulberry32)', () => {
    const a = mulberry32(20260911);
    const b = mulberry32(20260911);
    for (let i = 0; i < 500; i++) {
      const x = a();
      expect(x).toBe(b());
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
});

/* ---- the plan §8 proof: 100 seeds per shipped level ------------------------
 * Every shipped level must generate cleanly — a throw here is a data bug,
 * and the plan says such data must never ship.
 * -------------------------------------------------------------------------- */

describe.each(ALL_LEVELS.map((l) => [l.theme + ' L' + l.level, l] as const))(
  'generateLevel termination (%s)',
  (_label, { size, words, levelData }) => {
    it('100 seeds place all words with no restart exhaustion', () => {
      for (let seed = 1; seed <= 100; seed++) {
        const gen = generateLevel(levelData, seed);
        expect(gen.placements).toHaveLength(words.length);
        expect(gen.grid).toHaveLength(size);
      }
    });
  },
  60000
);

describe('lintThemes', () => {
  it('catches wrong tier size, bad par, short/duplicate/non-letter words', () => {
    const broken = {
      themes: [
        {
          id: 'x',
          name: 'X',
          emoji: '❌',
          levels: [
            { size: 9, parSec: 0, words: ['CAT', 'LION', 'LION', 'ELEPHANT!', 'TOOLONGWORDX'] },
            { size: 10, parSec: 150, words: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] },
            { size: 12, parSec: 240, words: [] },
          ],
        },
      ],
    };
    const errs = lintThemes(broken);
    expect(errs.length).toBeGreaterThanOrEqual(6);
    expect(errs.some((e) => e.includes('size must be 8'))).toBe(true);
    expect(errs.some((e) => e.includes('LION'))).toBe(true);
    expect(errs.some((e) => e.includes('CAT'))).toBe(true);
    expect(errs.some((e) => e.includes('exactly 7 words'))).toBe(true);
  });

  it('rejects a themes object without themes', () => {
    expect(lintThemes(null)).toHaveLength(1);
    expect(lintThemes({})).toHaveLength(1);
    expect(lintThemes({ themes: [] })).toHaveLength(1);
  });

  it('flags a theme that does not ship exactly 3 levels', () => {
    const errs = lintThemes({
      themes: [{ id: 't', name: 'T', emoji: '🧩', levels: [] }],
    });
    expect(errs.some((e) => e.includes('exactly 3 levels'))).toBe(true);
  });
});

describe('formatTime + storage keys', () => {
  it('formats the m:ss clock', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(90000)).toBe('1:30');
    expect(formatTime(239999)).toBe('3:59');
    expect(formatTime(3600000)).toBe('60:00');
  });

  it('keeps the README §2 key layout', () => {
    expect(PROGRESS_KEY).toBe('game:word-puzzle:progress');
    expect(PREFS_KEY).toBe('game:word-puzzle:prefs');
  });
});
