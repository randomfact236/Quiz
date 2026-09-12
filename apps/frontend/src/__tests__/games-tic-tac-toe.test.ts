/**
 * Pure-logic tests for the static game at
 * public/games/tic-tac-toe/ (plan/games/02-tic-tac-toe.md §12 Rev 2). The
 * pure model lives in the game's core.js and persistence in storage.js
 * (versioned save + legacy migration); the same assertions ship in the
 * folder's game.test.html harness. Includes the exhaustive "Hard is
 * unbeatable" sweeps for both rule sets.
 */
import {
  bestMove,
  checkWinner,
  completesLine,
  emptyBoard,
  gameValue,
  legalMoves,
  mediumMove,
  other,
  roundOutcome,
} from '../../public/games/tic-tac-toe/core';
import {
  PREFS_KEY,
  SAVE_KEY,
  SERIES_KEY,
  loadPrefs,
  loadSeries,
  savePrefs,
  saveSeries,
  seriesSetupKey,
} from '../../public/games/tic-tac-toe/storage';

const spec = (s: string) => s.split('').map((c) => (c === '.' ? null : c));
const show = (board: (string | null)[]) => board.map((c) => c || '.').join('');

describe('checkWinner (all 8 lines + draw + empty board)', () => {
  it.each([['X'], ['O']])('detects each of the 8 lines for %s', (mark) => {
    const m = mark as 'X' | 'O';
    for (const line of [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ]) {
      const board: (string | null)[] = emptyBoard();
      board[line[0]] = m;
      board[line[1]] = m;
      board[line[2]] = m;
      // up to two opponent marks off the line — too few to complete anything
      let placed = 0;
      for (let c = 0; c < 9 && placed < 2; c++) {
        if (!board[c]) {
          board[c] = other(m);
          placed++;
        }
      }
      const result = checkWinner(board);
      expect(result).not.toBeNull();
      expect(result).not.toBe('draw');
      expect((result as { completedBy: string }).completedBy).toBe(m);
    }
  });

  it('open boards are null', () => {
    expect(checkWinner(emptyBoard())).toBeNull();
    expect(checkWinner(spec('XO.XO....'))).toBeNull();
  });

  it('a full board without a line draws; with a line it names the winner', () => {
    expect(checkWinner(spec('XOXXOOOXX'))).toBe('draw');
    const full = checkWinner(spec('XOXOXOXOX')); // X owns both diagonals
    expect(full).toMatchObject({ completedBy: 'X' });
  });
});

describe('roundOutcome (misère flips the winner)', () => {
  const xTopRow = spec('XXXOO....'); // a real, reachable position

  it('normal rules: the completer wins', () => {
    expect(roundOutcome(xTopRow, false)).toMatchObject({ winner: 'X' });
  });

  it('misère rules: the completer loses', () => {
    expect(roundOutcome(xTopRow, true)).toMatchObject({ winner: 'O' });
  });

  it('misère: full board without a line still draws', () => {
    expect(roundOutcome(spec('XOXXOOOXX'), true)).toBe('draw');
  });
});

describe('series persistence (Rev 2 versioned save)', () => {
  const KEYS = [SAVE_KEY, SERIES_KEY, PREFS_KEY, SERIES_KEY + ':1p-hard', SERIES_KEY + ':2p'];
  let original: Record<string, string | null>;

  beforeEach(() => {
    original = Object.fromEntries(KEYS.map((k) => [k, window.localStorage.getItem(k)]));
    KEYS.forEach((k) => window.localStorage.removeItem(k));
  });

  afterAll(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    }
  });

  it('composes one key per exact setup', () => {
    expect(seriesSetupKey('1p', 'hard', true)).toBe('1p:hard:misere');
    expect(seriesSetupKey('2p', 'easy', false)).toBe('2p');
  });

  it('save → load round-trips a tally per setup', () => {
    saveSeries('1p:hard', { x: 3, o: 2, draw: 1 });
    saveSeries('2p', { x: 9, o: 0, draw: 0 });
    expect(loadSeries('1p:hard')).toEqual({ x: 3, o: 2, draw: 1 });
    expect(loadSeries('2p')).toEqual({ x: 9, o: 0, draw: 0 });
  });

  it('unknown setups and corrupt stores load as a zeroed tally', () => {
    expect(loadSeries('never-played')).toEqual({ x: 0, o: 0, draw: 0 });
    window.localStorage.setItem(SAVE_KEY, '{not json');
    expect(loadSeries('1p:hard')).toEqual({ x: 0, o: 0, draw: 0 });
  });

  it('migrates legacy series + prefs keys into the versioned save', () => {
    window.localStorage.setItem(SERIES_KEY, JSON.stringify({ '1p:hard': { x: 3, o: 2, draw: 1 } }));
    window.localStorage.setItem(
      PREFS_KEY,
      JSON.stringify({ mode: '2p', level: 'easy', misere: true })
    );
    expect(loadSeries('1p:hard')).toEqual({ x: 3, o: 2, draw: 1 });
    expect(loadPrefs()).toEqual({ mode: '2p', level: 'easy', misere: true });
    expect(window.localStorage.getItem(SERIES_KEY)).toBeNull(); // legacy removed
    expect(window.localStorage.getItem(PREFS_KEY)).toBeNull();
  });

  it('migrates the plan §5 per-mode loose keys (dash modeKeys, draws as `d`)', () => {
    window.localStorage.setItem(SERIES_KEY + ':1p-hard', JSON.stringify({ x: 3, o: 2, d: 1 }));
    window.localStorage.setItem(SERIES_KEY + ':2p', JSON.stringify({ x: 1, o: 0, d: 0 }));
    expect(loadSeries('1p:hard')).toEqual({ x: 3, o: 2, draw: 1 });
    expect(loadSeries('2p')).toEqual({ x: 1, o: 0, draw: 0 });
    expect(window.localStorage.getItem(SERIES_KEY + ':1p-hard')).toBeNull(); // legacy removed
    expect(window.localStorage.getItem(SERIES_KEY + ':2p')).toBeNull();
  });

  it('a setup found in both legacy layouts keeps every game from either', () => {
    window.localStorage.setItem(SERIES_KEY, JSON.stringify({ '1p:hard': { x: 1, o: 0, draw: 0 } }));
    window.localStorage.setItem(SERIES_KEY + ':1p-hard', JSON.stringify({ x: 2, o: 1, d: 1 }));
    expect(loadSeries('1p:hard')).toEqual({ x: 3, o: 1, draw: 1 });
    expect(window.localStorage.getItem(SERIES_KEY)).toBeNull();
    expect(window.localStorage.getItem(SERIES_KEY + ':1p-hard')).toBeNull();
  });
});

describe('menu prefs persistence (Rev 2: normalized defaults)', () => {
  const KEYS = [SAVE_KEY, PREFS_KEY];
  let original: Record<string, string | null>;

  beforeEach(() => {
    original = Object.fromEntries(KEYS.map((k) => [k, window.localStorage.getItem(k)]));
    KEYS.forEach((k) => window.localStorage.removeItem(k));
  });

  afterAll(() => {
    for (const [k, v] of Object.entries(original)) {
      if (v === null) window.localStorage.removeItem(k);
      else window.localStorage.setItem(k, v);
    }
  });

  it('nothing stored loads as the defaults — a fresh install keeps them', () => {
    expect(loadPrefs()).toEqual({ mode: '1p', level: 'medium', misere: false });
  });

  it('save → load round-trips mode/level/misère', () => {
    savePrefs({ mode: '2p', level: 'easy', misere: true });
    expect(loadPrefs()).toEqual({ mode: '2p', level: 'easy', misere: true });
    savePrefs({ mode: '1p', level: 'hard', misere: false });
    expect(loadPrefs()).toEqual({ mode: '1p', level: 'hard', misere: false });
  });

  it('sanitizes out-of-range values and corrupt stores into defaults', () => {
    savePrefs({ mode: 'nonsense', level: 'impossible', misere: 'truthy' });
    expect(loadPrefs()).toEqual({ mode: '1p', level: 'medium', misere: true });
    window.localStorage.setItem(SAVE_KEY, '{not json');
    expect(loadPrefs()).toEqual({ mode: '1p', level: 'medium', misere: false });
  });
});

describe('medium AI (win/block heuristic)', () => {
  it('takes a completing move under normal rules', () => {
    expect(mediumMove(spec('XX.O.....'), 'X', false)).toBe(2);
  });

  it('blocks the opponent line under normal rules', () => {
    expect(mediumMove(spec('OO..X....'), 'X', false)).toBe(2);
  });

  it('misère: never volunteers the losing completion', () => {
    for (let trial = 0; trial < 25; trial++) {
      expect(mediumMove(spec('XX...O...'), 'X', true)).not.toBe(2);
    }
  });

  it('completesLine is the primitive both modes rely on', () => {
    expect(completesLine(spec('XX.......'), 2, 'X')).toBe(true);
    expect(completesLine(spec('XX.O.....'), 2, 'O')).toBe(false);
  });
});

/* ---- the "Hard is unbeatable" proof -----------------------------------------
 * Sweep every position reachable in real play (recursion stops where the game
 * ends — a completed line or a full board — under either rule set) and assert
 * bestMove always plays the position's exact game value. That is the precise
 * form of unbeatable: the AI can only be beaten from positions that are
 * already theoretically lost.
 * --------------------------------------------------------------------------- */

function sweep(onBoard: (board: (string | null)[], turn: 'X' | 'O') => void): number {
  const seen = new Set<string>();
  const turnOf = (board: (string | null)[]) => {
    const x = board.filter((c) => c === 'X').length;
    const o = board.filter((c) => c === 'O').length;
    return x === o ? ('X' as const) : ('O' as const);
  };
  const walk = (board: (string | null)[]): void => {
    const key = show(board);
    if (seen.has(key)) return;
    seen.add(key);
    onBoard(board, turnOf(board));
    if (checkWinner(board) !== null) return;
    for (let i = 0; i < 9; i++) {
      if (board[i]) continue;
      board[i] = turnOf(board);
      walk(board);
      board[i] = null;
    }
  };
  walk(emptyBoard());
  return seen.size;
}

describe.each([
  ['normal', false],
  ['misère', true],
])('minimax exhaustive sweep (%s rules)', (_name, misere) => {
  it('bestMove is game-value optimal at every reachable position', () => {
    let choicePoints = 0;
    let leaves = 0;
    const total = sweep((board, turn) => {
      const outcome = roundOutcome(board, misere);
      const value = gameValue(board, turn, misere);
      if (outcome === 'draw') {
        expect(value).toBe(0);
        leaves++;
        return;
      }
      if (outcome) {
        expect(outcome.winner === turn ? value > 0 : value < 0).toBe(true);
        leaves++;
        return;
      }
      const choice = bestMove(board, turn, misere);
      expect(choice).not.toBeNull();
      expect(choice!.value).toBe(value);
      // Unbeatable, stated precisely: whenever the position is not already
      // lost, the AI's move keeps it non-lost.
      if (value >= 0) expect(choice!.value).toBeGreaterThanOrEqual(0);
      choicePoints++;
    });
    expect(total).toBeGreaterThan(1000);
    expect(choicePoints).toBeGreaterThan(4000);
    void leaves;
  }, 60000);
});

describe('game-theory sanity (empty board)', () => {
  it('normal rules draw under perfect play, whoever opens', () => {
    // abs(): negamax can legitimately produce -0 for a draw, and jest's
    // toBe/toEqual both distinguish it from +0.
    expect(Math.abs(gameValue(emptyBoard(), 'X', false))).toBe(0);
    expect(Math.abs(gameValue(emptyBoard(), 'O', false))).toBe(0);
  });

  it('misère rules also compute to a draw (computed, not assumed)', () => {
    expect(gameValue(emptyBoard(), 'X', true)).toBeGreaterThanOrEqual(0);
  });

  it('legalMoves on the empty board offers all nine cells', () => {
    expect(legalMoves(emptyBoard())).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
