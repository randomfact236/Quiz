import {
  COLS,
  ROWS,
  CELLS,
  emptyBoard,
  lowestRow,
  validColumns,
  dropInPlace,
  roundOutcome,
  winningColumns,
  aiMove,
} from '../../public/games/connect-four/core.js';

/**
 * plan/games/01 phase 1 — the pure Connect Four model: gravity, the four-axis
 * win scan, draws, full-column rejection, and AI tier sanity. The mirror of
 * the tictactoe core suite.
 */
describe('connect-four core', () => {
  const R = 'R';
  const Y = 'Y';

  function setCol(board, col, marks) {
    // drop marks bottom-up like gravity would
    marks.forEach((mark, i) => {
      const row = ROWS - 1 - i;
      board[row * COLS + col] = mark;
    });
  }

  it('applies gravity: drops land in the lowest empty row', () => {
    const board = emptyBoard();
    expect(lowestRow(board, 3)).toBe(ROWS - 1);
    expect(dropInPlace(board, 3, R)).toBe(ROWS - 1);
    expect(dropInPlace(board, 3, Y)).toBe(ROWS - 2);
    expect(dropInPlace(board, 3, R)).toBe(ROWS - 3);
  });

  it('rejects a full column', () => {
    const board = emptyBoard();
    for (let i = 0; i < ROWS; i++) dropInPlace(board, 0, i % 2 === 0 ? R : Y);
    expect(lowestRow(board, 0)).toBe(-1);
    expect(dropInPlace(board, 0, R)).toBe(-1);
    expect(validColumns(board)).not.toContain(0);
    expect(validColumns(board)).toContain(3);
  });

  it('detects a horizontal four from the last drop', () => {
    const board = emptyBoard();
    setCol(board, 0, [R, Y, R]);
    setCol(board, 1, [R, Y]);
    setCol(board, 2, [R]);
    const row = dropInPlace(board, 3, R); // bottom row now R R R R
    const outcome = roundOutcome(board, row, 3);
    expect(outcome).toEqual({ winner: R, line: expect.any(Array) });
    expect(outcome.line).toHaveLength(4);
  });

  it('detects a vertical four', () => {
    const board = emptyBoard();
    setCol(board, 5, [R, R, R]);
    const row = dropInPlace(board, 5, R);
    const outcome = roundOutcome(board, row, 5);
    expect(outcome.winner).toBe(R);
  });

  it('detects both diagonal directions', () => {
    // ↗ diagonal: R at (5,0) (4,1) (3,2), Y elsewhere; R drops (2,3)
    const board = emptyBoard();
    setCol(board, 0, [Y, R, Y, R]); // rows 5..2 → R at rows 5 and 3
    setCol(board, 1, [Y, Y, R, R]); // R at rows 5 and 4? careful — build explicitly:
    board.fill(null);
    // explicit ↗ setup: R at (5,0), (4,1), (3,2); drop R at (2,3)
    board[(5 - 0) * COLS + 0] = R;
    board[(5 - 1) * COLS + 1] = R;
    board[(5 - 2) * COLS + 2] = R;
    board[(5 - 3) * COLS + 3] = R;
    const outcome = roundOutcome(board, 5 - 3, 3);
    expect(outcome.winner).toBe(R);
    // ↘ mirrored: R at (2,0), (3,1), (4,2); drop R at (5,3)
    board.fill(null);
    board[2 * COLS + 0] = R;
    board[3 * COLS + 1] = R;
    board[4 * COLS + 2] = R;
    board[5 * COLS + 3] = R;
    expect(roundOutcome(board, 5, 3).winner).toBe(R);
  });

  it("returns 'draw' for a full board when the last drop forms no line", () => {
    const board = emptyBoard();
    for (let i = 0; i < CELLS; i++) board[i] = R;
    // break every axis through the last dropped cell (5,6)
    board[5 * COLS + 5] = Y; // horizontal
    board[4 * COLS + 6] = Y; // vertical
    board[4 * COLS + 5] = Y; // ↘ diagonal; ↗ is off-grid from the bottom row
    expect(roundOutcome(board, ROWS - 1, COLS - 1)).toBe('draw');
  });

  it('returns null on a non-full board with no win from the last drop', () => {
    const board = emptyBoard();
    const row = dropInPlace(board, 3, R);
    expect(roundOutcome(board, row, 3)).toBeNull();
  });
  it('never reports a win through a broken window', () => {
    const board = emptyBoard();
    setCol(board, 0, [R, Y]);
    setCol(board, 1, [R, Y]);
    setCol(board, 2, [Y, R]);
    const row = dropInPlace(board, 3, R);
    expect(roundOutcome(board, row, 3)).toBeNull();
  });

  it('keeps winningColumns honest (the AI legality surface)', () => {
    const board = emptyBoard();
    setCol(board, 0, [R, R, R]);
    const wins = winningColumns(board, R);
    expect(wins).toEqual([0]);
    expect(winningColumns(board, Y)).toEqual([]);
  });

  it('medium AI blocks an immediate opponent win', () => {
    const board = emptyBoard();
    setCol(board, 0, [Y, Y, Y]);
    const col = aiMove(board, R, 'medium');
    expect(col).toBe(0); // the only column where Y would win — must be blocked
  });

  it('medium AI takes its own immediate win', () => {
    const board = emptyBoard();
    setCol(board, 6, [R, R, R]);
    const col = aiMove(board, R, 'medium');
    expect(col).toBe(6);
  });

  it('hard AI finds the forced sequence and never returns an invalid column', () => {
    const board = emptyBoard();
    setCol(board, 0, [R, R, R]);
    const col = aiMove(board, Y, 'hard', 5);
    expect(col).toBe(0); // blocking is the only non-losing reply
    for (let depth = 2; depth <= 6; depth += 2) {
      const probe = aiMove(emptyBoard(), R, 'hard', depth);
      expect(probe).toBeGreaterThanOrEqual(0);
      expect(probe).toBeLessThan(COLS);
    }
  });

  it('exposes a full 42-cell board', () => {
    expect(CELLS).toBe(42);
    expect(emptyBoard()).toHaveLength(42);
  });
});
