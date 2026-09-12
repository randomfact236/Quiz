/**
 * Pure-logic tests for the static game at
 * public/games/tap-or-dont-tap/ (plan/games/01-tap-or-dont-tap.md §13 Rev 2).
 * The pure model lives in the game's core.js; this suite also covers the
 * storage facade (versioned save + legacy migration) and config resolution.
 */
import {
  DECOY_IGNORE_POINTS,
  RESIST_POINTS,
  bakedPercentile,
  effectiveExpectsTap,
  generateRound,
  localPercentile,
  pointsForGreen,
  resolveRound,
  sparklinePoints,
  windowMsForRound,
} from '../../public/games/tap-or-dont-tap/core';
import {
  getBest,
  getHistory,
  getMuted,
  loadSave,
  recordRun,
  setMuted,
} from '../../public/games/tap-or-dont-tap/storage';
import { GAME_CONFIG, resolveConfig, t } from '../../public/games/tap-or-dont-tap/config';

const rng = (value: number) => () => value;

describe('windowMsForRound (difficulty ramp)', () => {
  it('starts at 1200ms and shrinks 25ms per round', () => {
    expect(windowMsForRound(1)).toBe(1200);
    expect(windowMsForRound(2)).toBe(1175);
    expect(windowMsForRound(5)).toBe(1100);
  });

  it('never drops below the 450ms floor', () => {
    expect(windowMsForRound(31)).toBe(450);
    expect(windowMsForRound(100)).toBe(450);
  });
});

describe('pointsForGreen (streak bonus, ×5 cap)', () => {
  it('gives base 100 plus 10 per streak point', () => {
    expect(pointsForGreen(0)).toBe(100);
    expect(pointsForGreen(5)).toBe(150);
  });

  it('caps at 5× the base (500)', () => {
    expect(pointsForGreen(40)).toBe(500);
    expect(pointsForGreen(999)).toBe(500);
  });
});

describe('generateRound (feature tiers)', () => {
  it('rounds below 10 only ever produce green/red', () => {
    for (const roll of [0.1, 0.6, 0.95]) {
      const spec = generateRound(5, rng(roll));
      expect(['green', 'red']).toContain(spec.color);
      expect(spec.word).toBeNull();
    }
    expect(generateRound(5, rng(0.1)).expectsTap).toBe(true);
    expect(generateRound(5, rng(0.9)).expectsTap).toBe(false);
  });

  it('rounds 10+ can produce decoys (never tap)', () => {
    const decoy = generateRound(12, rng(0.9));
    expect(['yellow', 'blue']).toContain(decoy.color);
    expect(decoy.expectsTap).toBe(false);
    expect(decoy.word).toBeNull();
  });

  it('rounds 15+ can produce Stroop traps with a contradicting word', () => {
    const trapGreen = generateRound(20, rng(0.9));
    expect(trapGreen).toMatchObject({ color: 'green', expectsTap: true, word: 'WAIT' });
    // First roll (0.9) reaches the trap branch; the second (0.2 < 0.5) picks red "TAP".
    const seq = [0.9, 0.2];
    let i = 0;
    const trapRed = generateRound(20, () => seq[i++] ?? 0);
    expect(trapRed).toMatchObject({ color: 'red', expectsTap: false, word: 'TAP' });
  });

  it('plainOnly (rule-flip rounds) keeps decoys and traps out', () => {
    for (const roll of [0.5, 0.9, 0.99]) {
      const spec = generateRound(25, rng(roll), { plainOnly: true });
      expect(['green', 'red']).toContain(spec.color);
      expect(spec.word).toBeNull();
    }
  });
});

describe('effectiveExpectsTap (rule flip)', () => {
  const green = { color: 'green', expectsTap: true, word: null };
  const red = { color: 'red', expectsTap: false, word: null };
  const decoy = { color: 'yellow', expectsTap: false, word: null };

  it('is the identity when rules are not swapped', () => {
    expect(effectiveExpectsTap(green, false)).toBe(true);
    expect(effectiveExpectsTap(red, false)).toBe(false);
  });

  it('inverts green/red but leaves decoys as never-tap', () => {
    expect(effectiveExpectsTap(green, true)).toBe(false);
    expect(effectiveExpectsTap(red, true)).toBe(true);
    expect(effectiveExpectsTap(decoy, true)).toBe(false);
  });
});

describe('resolveRound (all four outcomes)', () => {
  const green = { color: 'green', expectsTap: true, word: null };
  const red = { color: 'red', expectsTap: false, word: null };
  const decoy = { color: 'yellow', expectsTap: false, word: null };

  it('hit on green: records reaction ms and streak points', () => {
    const result = resolveRound(green, { tapped: true, elapsedMs: 218.4, streak: 3 });
    expect(result).toMatchObject({ outcome: 'hit', points: 130, heartsLost: 0, reactionMs: 218 });
  });

  it('missed green (window expired): lose a heart', () => {
    expect(resolveRound(green, { tapped: false })).toMatchObject({
      outcome: 'miss',
      points: 0,
      heartsLost: 1,
    });
  });

  it('tap on red: lose a heart', () => {
    expect(resolveRound(red, { tapped: true, elapsedMs: 90 })).toMatchObject({
      outcome: 'tap-red',
      heartsLost: 1,
    });
  });

  it('red expires untouched: resist bonus', () => {
    expect(resolveRound(red, { tapped: false })).toMatchObject({
      outcome: 'resist',
      points: RESIST_POINTS,
      heartsLost: 0,
    });
  });

  it('decoys: tapping loses a heart, ignoring pays +50', () => {
    expect(resolveRound(decoy, { tapped: true, elapsedMs: 120 })).toMatchObject({
      outcome: 'tap-decoy',
      heartsLost: 1,
      points: 0,
    });
    expect(resolveRound(decoy, { tapped: false })).toMatchObject({
      outcome: 'decoy-ignored',
      points: DECOY_IGNORE_POINTS,
      heartsLost: 0,
    });
  });

  it('Stroop trap: the word is a lie — color wins', () => {
    // "TAP" in red: tapping is still a tap-red heart loss.
    const trap = { color: 'red', expectsTap: false, word: 'TAP' };
    expect(resolveRound(trap, { tapped: true, elapsedMs: 150 })).toMatchObject({
      outcome: 'tap-red',
      heartsLost: 1,
    });
    expect(resolveRound(trap, { tapped: false })).toMatchObject({ outcome: 'resist' });
  });

  it('rule flip: green must be resisted, red must be tapped', () => {
    expect(resolveRound(green, { rulesSwapped: true, tapped: true, elapsedMs: 200 })).toMatchObject(
      {
        outcome: 'tap-red',
        heartsLost: 1,
      }
    );
    expect(resolveRound(red, { rulesSwapped: true, tapped: true, elapsedMs: 200 })).toMatchObject({
      outcome: 'hit',
    });
    expect(resolveRound(red, { rulesSwapped: true, tapped: false })).toMatchObject({
      outcome: 'miss',
      heartsLost: 1,
    });
  });
});

describe('percentile (local history, baked fallback)', () => {
  it('uses the baked table until there are ≥5 past runs', () => {
    expect(bakedPercentile(5000)).toBe(3);
    expect(bakedPercentile(1500)).toBe(12);
    expect(bakedPercentile(0)).toBe(50);
    expect(localPercentile(1500, [100, 200])).toBe(12);
  });

  it('with real history: top-% = 100 minus share of past runs beaten, clamped to 1–99%', () => {
    const history = [10, 20, 30, 40, 50];
    // beats 3 of 5 runs (60%) ⇒ top 40%
    expect(localPercentile(35, history)).toBe(40);
    // beats every past run ⇒ top 1% (clamped)
    expect(localPercentile(60, history)).toBe(1);
    // beats no past run ⇒ top 99% (clamped)
    expect(localPercentile(5, history)).toBe(99);
  });
});

describe('sparklinePoints (menu history chart)', () => {
  it('needs at least two values', () => {
    expect(sparklinePoints([])).toBe('');
    expect(sparklinePoints([42])).toBe('');
  });

  it('maps oldest→newest across the box, min at the bottom', () => {
    expect(sparklinePoints([0, 10], 200, 40)).toBe('0,38 200,2');
  });

  it('handles a flat curve (zero span)', () => {
    expect(sparklinePoints([5, 5, 5], 200, 40)).toBe('0,38 100,38 200,38');
  });
});

describe('storage facade (Rev 2: versioned save + legacy migration)', () => {
  const KEYS = {
    save: 'game:tap-or-dont-tap:save',
    best: 'game:tap-or-dont-tap:best',
    history: 'game:tap-or-dont-tap:history',
    muted: 'game:tap-or-dont-tap:muted',
  };
  let original: Record<string, string | null>;

  beforeEach(() => {
    original = Object.fromEntries(Object.values(KEYS).map((k) => [k, localStorage.getItem(k)]));
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  });

  afterAll(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    }
  });

  it('defaults to a fresh versioned save when nothing is stored', () => {
    expect(loadSave()).toEqual({
      version: 1,
      best: { score: 0, bestMs: null },
      history: [],
      prefs: { muted: false },
    });
  });

  it('migrates legacy keys into the versioned save and removes them', () => {
    localStorage.setItem(KEYS.best, JSON.stringify({ score: 1240, bestMs: 187 }));
    localStorage.setItem(
      KEYS.history,
      JSON.stringify([{ score: 900, bestMs: 201, rounds: 18, ts: 1 }])
    );
    localStorage.setItem(KEYS.muted, '1');

    const save = loadSave();
    expect(save.version).toBe(1);
    expect(save.best).toEqual({ score: 1240, bestMs: 187 });
    expect(save.history).toEqual([{ score: 900, bestMs: 201, rounds: 18, ts: 1 }]);
    expect(save.prefs.muted).toBe(true);
    expect(localStorage.getItem(KEYS.best)).toBeNull();
    expect(localStorage.getItem(KEYS.history)).toBeNull();
    expect(localStorage.getItem(KEYS.muted)).toBeNull();
  });

  it('recordRun keeps the higher score and the lower reaction independently', () => {
    recordRun({ score: 500, bestMs: 200 });
    const { best, isRecord } = recordRun({ score: 400, bestMs: 180 });
    expect(isRecord).toBe(false); // 400 < 500
    expect(best).toEqual({ score: 500, bestMs: 180 });
    expect(getBest()).toEqual(best);
    // History entries carry only score + bestMs (plan §5 schema).
    expect(getHistory()).toEqual([
      { score: 500, bestMs: 200 },
      { score: 400, bestMs: 180 },
    ]);
  });

  it('caps history at 20 entries', () => {
    for (let i = 1; i <= 25; i++) recordRun({ score: i, bestMs: 100 + i });
    const history = getHistory();
    expect(history).toHaveLength(20);
    expect(history[0].score).toBe(6); // oldest kept entry
    expect(history[history.length - 1].score).toBe(25);
  });

  it('muted round-trips through the save', () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });
});

describe('config (flags + strings, host-overridable)', () => {
  it('resolveConfig merges host overrides over defaults, strings per locale', () => {
    const merged = resolveConfig(
      { locale: 'en', strings: { en: { share: 'EN' }, fr: { share: 'FR' } } },
      { locale: 'fr', strings: { fr: { share: 'FR2' } } }
    );
    expect(merged.locale).toBe('fr');
    expect(merged.strings.en.share).toBe('EN');
    expect(merged.strings.fr.share).toBe('FR2');
  });

  it('ignores malformed override layers', () => {
    const merged = resolveConfig({ locale: 'en', strings: { en: { share: 'EN' } } }, null, {
      strings: 'garbage',
    });
    expect(merged.strings.en.share).toBe('EN');
  });

  it('t() substitutes vars from the active locale and falls back to the key', () => {
    expect(t('share', { bestMs: '187ms', score: '1,240', url: 'http://x' })).toContain(
      'Best reaction: 187ms'
    );
    expect(t('no-such-key')).toBe('no-such-key');
  });

  it('ships the full en copy set (plan §13: rule line, swap banner, feedback, gameover, share)', () => {
    expect(Object.keys(GAME_CONFIG.strings.en)).toEqual(
      expect.arrayContaining([
        'menuRule',
        'swapBanner',
        'tooEarly',
        'hitMs',
        'resisted',
        'ignored',
        'tooSlow',
        'stroopLie',
        'wasRed',
        'goTitle',
        'bestReaction',
        'topBadge',
        'newRecord',
        'shareScoreBtn',
        'retryBtn',
        'backToMenu',
        'copiedNote',
        'share',
      ])
    );
  });
});
