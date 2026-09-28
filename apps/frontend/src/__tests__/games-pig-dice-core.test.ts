import {
  TARGETS,
  DEFAULT_TARGET,
  createState,
  other,
  applyRoll,
  applyHold,
  isWin,
  holdThreshold,
  aiAction,
} from '../../public/games/pig-dice/core.js';

/**
 * plan/games/05 — the pure Pig Dice model: pot build, the bust on a 1, hold →
 * bank → turn pass, win detection, and the three AI policy tiers.
 */
describe('pig-dice core', () => {
  it('ships 50/100 targets and a fresh state', () => {
    expect(TARGETS).toEqual([50, 100]);
    expect(createState()).toEqual({ scores: [0, 0], pot: 0, turn: 1, target: DEFAULT_TARGET });
    expect(createState(50).target).toBe(50);
    expect(other(1)).toBe(2);
    expect(other(2)).toBe(1);
  });

  it('rolls 2–6 into the pot and keeps the turn', () => {
    let state = createState();
    for (const pips of [4, 5, 3]) {
      const r = applyRoll(state, pips);
      expect(r.busted).toBe(false);
      expect(r.pips).toBe(pips);
      state = r.state;
    }
    expect(state.pot).toBe(12);
    expect(state.turn).toBe(1);
  });

  it('loses the pot and passes the turn on a 1', () => {
    const state = { ...createState(), pot: 17 };
    const r = applyRoll(state, 1);
    expect(r.busted).toBe(true);
    expect(r.state.pot).toBe(0);
    expect(r.state.turn).toBe(2);
    // banked points survive the bust
    expect(r.state.scores).toEqual([0, 0]);
  });

  it('holds: banks the pot, passes the turn, and reports a win at the target', () => {
    const state = { ...createState(50), pot: 30 };
    const h = applyHold(state);
    expect(h.banked).toBe(30);
    expect(h.state.scores).toEqual([30, 0]);
    expect(h.state.turn).toBe(2);
    expect(h.won).toBe(false);

    const closing = { ...createState(50), scores: [30, 40], pot: 25, turn: 1 };
    const h2 = applyHold(closing);
    expect(h2.state.scores).toEqual([55, 40]);
    expect(h2.won).toBe(true);
  });

  it('detects a win by banked score only', () => {
    expect(isWin([50, 0], 1, 50)).toBe(true);
    expect(isWin([49, 0], 1, 50)).toBe(false);
    // a big POT is not a win — it must be banked
    expect(isWin([0, 0], 1, 50)).toBe(false);
  });

  it('clamps out-of-range pips (server sanity)', () => {
    expect(applyRoll(createState(), 0).pips).toBe(1);
    expect(applyRoll(createState(), 9).pips).toBe(6);
  });

  describe('AI policy', () => {
    it('easy holds somewhere in 10–30 (never 0, never >30)', () => {
      for (let n = 0; n < 40; n++) {
        const t = holdThreshold(createState(), 1, 'easy');
        expect(t).toBeGreaterThanOrEqual(10);
        expect(t).toBeLessThanOrEqual(30);
      }
    });

    it('medium holds near the classic 18–24 band', () => {
      for (const pot of [19, 21, 22, 25]) {
        const t = holdThreshold({ ...createState(), pot }, 1, 'medium');
        expect(t).toBeGreaterThanOrEqual(18);
        expect(t).toBeLessThanOrEqual(24);
      }
    });

    it('hard holds at the optimum when level, chases when behind, protects a lead', () => {
      const level = { ...createState(), scores: [30, 30] };
      expect(holdThreshold(level, 1, 'hard')).toBe(21);
      const behind = { ...createState(), scores: [5, 40] };
      expect(holdThreshold(behind, 1, 'hard')).toBeLessThan(21);
      const ahead = { ...createState(), scores: [70, 20] };
      expect(holdThreshold(ahead, 1, 'hard')).toBeGreaterThan(21);
      // a pot that can win the target by holding → the threshold keeps it
      const winning = { ...createState(50), scores: [35, 20], pot: 15 };
      expect(holdThreshold(winning, 1, 'hard')).toBeGreaterThanOrEqual(15);
    });

    it('aiAction rolls below the threshold and holds at/above it', () => {
      const low = { ...createState(), pot: 5 };
      expect(aiAction(low, 1, 'hard')).toBe('roll');
      const high = { ...createState(), pot: 30 };
      expect(aiAction(high, 1, 'hard')).toBe('hold');
    });
  });
});
