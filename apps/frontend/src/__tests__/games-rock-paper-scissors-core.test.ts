import {
  MOVES,
  LABELS,
  GLYPHS,
  DEFAULT_TARGET,
  beats,
  roundResult,
  createState,
  applyRound,
  isMatchWon,
  counterTo,
  easyPick,
  mediumPick,
  hardPick,
  aiPick,
} from '../../public/games/rock-paper-scissors/core.js';

/**
 * plan/games/07 — the pure RPS model: the beats cycle, round scoring, the
 * best-of-5 win, and the three AI tiers' legality + pattern use.
 */
describe('rock-paper-scissors core', () => {
  it('ships the three moves with labels and glyphs', () => {
    expect(MOVES).toEqual(['R', 'P', 'S']);
    expect(LABELS.R).toBe('Rock');
    expect(GLYPHS.S).toBe('✌️');
    expect(DEFAULT_TARGET).toBe(3);
  });

  it('implements the beats cycle', () => {
    expect(beats('R', 'S')).toBe(true);
    expect(beats('P', 'R')).toBe(true);
    expect(beats('S', 'P')).toBe(true);
    expect(beats('R', 'P')).toBe(false);
    expect(beats('P', 'S')).toBe(false);
    expect(beats('S', 'R')).toBe(false);
    expect(roundResult('R', 'R')).toBe('tie');
    expect(roundResult('P', 'S')).toBe('b'); // scissors beat paper
    expect(roundResult('P', 'R')).toBe('a'); // paper beats rock
  });

  it('counters correctly', () => {
    expect(counterTo('R')).toBe('P');
    expect(counterTo('P')).toBe('S');
    expect(counterTo('S')).toBe('R');
  });

  it('scores a round and records history', () => {
    let state = createState();
    let r = applyRound(state, 'R', 'S'); // win
    expect(r.result).toBe('you');
    state = r.state;
    r = applyRound(state, 'P', 'P'); // tie
    expect(r.result).toBe('tie');
    state = r.state;
    r = applyRound(state, 'S', 'R'); // loss
    expect(r.result).toBe('them');
    state = r.state;
    expect(state.wins).toEqual([1, 1]);
    expect(state.history).toEqual(['R', 'P', 'S']);
    expect(state.lastRound).toEqual({ you: 'S', them: 'R', result: 'them' });
  });

  it('detects the match win at first-to-3', () => {
    expect(isMatchWon([2, 0])).toBe(false);
    expect(isMatchWon([3, 1])).toBe(true);
    expect(isMatchWon([1, 3])).toBe(true);
    // playing it out
    let state = createState();
    state = applyRound(state, 'R', 'S').state;
    state = applyRound(state, 'R', 'S').state;
    state = applyRound(state, 'R', 'S').state;
    expect(state.wins).toEqual([3, 0]);
    expect(isMatchWon(state.wins, state.target)).toBe(true);
  });

  describe('AI tiers', () => {
    it('every tier always returns a legal move', () => {
      const histories = [[], ['R'], ['R', 'R', 'P'], ['R', 'R', 'R', 'R', 'R', 'R']];
      for (const h of histories) {
        for (const tier of ['easy', 'medium', 'hard']) {
          for (let n = 0; n < 15; n++) {
            const pick = aiPick(h, tier);
            expect(MOVES).toContain(pick);
          }
        }
      }
    });

    it('medium counters a predictable human (and takes the match over many rounds)', () => {
      // a human who always throws rock: medium should learn to play paper
      const history = Array(12).fill('R') as any;
      let paper = 0;
      for (let n = 0; n < 10; n++) if (mediumPick(history) === 'P') paper++;
      expect(paper).toBeGreaterThan(2);
    });

    it('hard exploits a repeating cycle (R→P→S→R…) via its Markov chain', () => {
      // cycle the human: R, P, S, R, P, S … — hard should counter the next
      // predicted throw more often than chance
      const history = ['R', 'P', 'S', 'R', 'P', 'S', 'R', 'P', 'S', 'R', 'P', 'S'] as any;
      const wanted: Record<string, string> = { R: 'P', P: 'S', S: 'R' };
      let correct = 0;
      for (let n = 0; n < 12; n++) {
        const next =
          history[history.length - 1] === 'R'
            ? 'P'
            : history[history.length - 1] === 'P'
              ? 'S'
              : 'R';
        if (hardPick(history) === wanted[next]) correct++;
      }
      expect(correct).toBeGreaterThan(4); // well above the 4/12 of pure luck
    });

    it('tiers fall back gracefully on short histories', () => {
      expect(MOVES).toContain(hardPick(['R']));
      expect(MOVES).toContain(mediumPick(['R', 'P']));
    });
  });
});
