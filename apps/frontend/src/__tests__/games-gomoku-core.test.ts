import {
  SIZES,
  WIN_LENGTH,
  createEmptyBoard,
  idx,
  rowColOf,
  placeInPlace,
  findWinFrom,
  roundOutcome,
  pointScore,
  candidateCells,
  isWinningCell,
  easyMove,
  mediumMove,
  hardMove,
  aiMove,
} from '../../public/games/gomoku/core.js';

/**
 * plan/games/02 — the pure Gomoku model: placement, the ≥5 freestyle win scan
 * in four axes, shape scoring, and the three AI tiers' legality. The mirror
 * of the connect-four core suite.
 */
describe('gomoku core', () => {
  const B = 'B';
  const W = 'W';
  const other = 'W';

  function line(size, cells, mark) {
    const board = createEmptyBoard(size);
    for (const [r, c] of cells) board[idx(size, r, c)] = mark;
    return board;
  }

  it('ships 11 and 15 boards', () => {
    expect(SIZES).toEqual([11, 15]);
    expect(createEmptyBoard(15)).toHaveLength(225);
    expect(createEmptyBoard(11)).toHaveLength(121);
  });

  it('places a stone only on an empty cell', () => {
    const board = createEmptyBoard(15);
    expect(placeInPlace(board, 15, 112, B)).toBe(true); // center
    expect(placeInPlace(board, 15, 112, W)).toBe(false); // occupied
    expect(placeInPlace(board, 15, 999, B)).toBe(false); // out of range
    expect(board[112]).toBe(B);
  });

  it('detects five in a row in all four axes (freestyle)', () => {
    const size = 15;
    // horizontal
    let board = line(
      size,
      [
        [7, 3],
        [7, 4],
        [7, 5],
        [7, 6],
      ],
      B
    );
    board[idx(size, 7, 2)] = B;
    const h = findWinFrom(board, size, idx(size, 7, 2));
    expect(h).not.toBeNull();
    expect(h.mark).toBe(B);
    expect(h.line.length).toBeGreaterThanOrEqual(WIN_LENGTH);

    // vertical
    board = line(
      size,
      [
        [3, 7],
        [4, 7],
        [5, 7],
        [6, 7],
      ],
      B
    );
    board[idx(size, 2, 7)] = B;
    expect(findWinFrom(board, size, idx(size, 2, 7))?.mark).toBe(B);

    // ↘ diagonal
    board = line(
      size,
      [
        [4, 4],
        [5, 5],
        [6, 6],
        [7, 7],
      ],
      B
    );
    board[idx(size, 3, 3)] = B;
    expect(findWinFrom(board, size, idx(size, 3, 3))?.mark).toBe(B);

    // ↗ diagonal
    board = line(
      size,
      [
        [4, 10],
        [5, 9],
        [6, 8],
        [7, 7],
      ],
      B
    );
    board[idx(size, 3, 11)] = B;
    expect(findWinFrom(board, size, idx(size, 3, 11))?.mark).toBe(B);
  });

  it('counts an overline (six in a row) as a win in freestyle', () => {
    const size = 15;
    const board = line(
      size,
      [
        [7, 3],
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 7],
      ],
      B
    );
    board[idx(size, 7, 2)] = B;
    const win = findWinFrom(board, size, idx(size, 7, 2));
    expect(win.line.length).toBe(6);
  });

  it('four in a row is NOT a win', () => {
    const size = 15;
    const board = line(
      size,
      [
        [7, 5],
        [7, 6],
        [7, 7],
        [7, 8],
      ],
      B
    );
    expect(findWinFrom(board, size, idx(size, 7, 5))).toBeNull();
    expect(roundOutcome(board, size, idx(size, 7, 5))).toBeNull();
  });

  it('roundOutcome reports the winner, a draw on a full board, or null', () => {
    const size = 11;
    // winner
    let board = line(
      size,
      [
        [5, 3],
        [5, 4],
        [5, 5],
        [5, 6],
      ],
      B
    );
    board[idx(size, 5, 2)] = B;
    const won = roundOutcome(board, size, idx(size, 5, 2));
    expect(won.winner).toBe(B);
    expect(won.line.length).toBeGreaterThanOrEqual(WIN_LENGTH);
    // draw: a full board with no five. The parity fill leaves same-colour
    // runs, so every axis through the last cell (the bottom-right corner —
    // only the negative directions exist) gets its first cell flipped.
    board = createEmptyBoard(size);
    for (let i = 0; i < board.length; i++) board[i] = i % 2 === 0 ? B : W;
    const last = board.length - 1;
    const { row, col } = rowColOf(size, last);
    for (const [dr, dc] of [
      [0, -1],
      [-1, 0],
      [-1, -1],
      [-1, 1],
    ]) {
      let r = row + dr;
      let c = col + dc;
      if (r >= 0 && r < size && c >= 0 && c < size && board[idx(size, r, c)] === board[last]) {
        board[idx(size, r, c)] = other;
      }
    }
    expect(findWinFrom(board, size, last)).toBeNull();
    expect(roundOutcome(board, size, last)).toBe('draw');
    // null mid-game
    const mid = createEmptyBoard(size);
    mid[idx(size, 5, 5)] = B;
    expect(roundOutcome(mid, size, idx(size, 5, 5))).toBeNull();
  });

  it('scores shapes: five > open four > blocked four > three', () => {
    const size = 15;
    // the score is for PLAYING at (7,c) on top of the existing stones
    const three = line(
      size,
      [
        [7, 6],
        [7, 7],
      ],
      B
    );
    const s3 = pointScore(three, size, 7, 5, B); // three, both ends open
    const fourBase = line(
      size,
      [
        [7, 5],
        [7, 6],
        [7, 7],
      ],
      B
    );
    const s4o = pointScore(fourBase, size, 7, 4, B); // four, both ends open
    const blocked = fourBase.slice();
    blocked[idx(size, 7, 8)] = W; // one end walled
    const s4 = pointScore(blocked, size, 7, 4, B);
    const five = fourBase.slice();
    five[idx(size, 7, 4)] = B;
    const s5 = pointScore(five, size, 7, 3, B); // completes five
    expect(s4).toBeGreaterThan(s3);
    expect(s4o).toBeGreaterThan(s4);
    expect(s5).toBeGreaterThan(s4o);
  });

  it('candidateCells stays near the action (and covers an empty board)', () => {
    const size = 15;
    const empty = candidateCells(createEmptyBoard(size), size);
    expect(empty.length).toBe(size * size);
    const board = createEmptyBoard(size);
    board[idx(size, 7, 7)] = B;
    const near = candidateCells(board, size);
    expect(near.length).toBeLessThan(size * size);
    expect(near.length).toBeGreaterThan(0);
    expect(near).not.toContain(idx(size, 7, 7)); // occupied cells excluded
  });

  it('isWinningCell finds an immediate five and nothing else', () => {
    const size = 15;
    const board = line(
      size,
      [
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 7],
      ],
      B
    );
    expect(isWinningCell(board, size, idx(size, 7, 3), B)).toBe(true);
    expect(isWinningCell(board, size, idx(size, 7, 3), W)).toBe(false);
    expect(isWinningCell(board, size, idx(size, 0, 0), B)).toBe(false);
  });

  it('every AI tier returns a legal empty cell near the action', () => {
    const size = 15;
    const board = line(
      size,
      [
        [7, 6],
        [7, 7],
      ],
      B
    );
    for (const tier of ['easy', 'medium', 'hard']) {
      const move = aiMove(board, size, W, tier, 4);
      expect(move).toBeGreaterThanOrEqual(0);
      expect(move).toBeLessThan(size * size);
      expect(board[move]).toBeNull();
    }
    // an empty board still yields a legal first move for every tier
    for (const tier of ['easy', 'medium', 'hard']) {
      const move = aiMove(createEmptyBoard(size), size, B, tier, 4);
      expect(move).toBeGreaterThanOrEqual(0);
    }
  });

  it('medium AI blocks an opponent open three instead of chasing its own shape', () => {
    // manual play found this: with an open three against it, medium built its
    // own line instead of defending. The blocking cells are the two open ends.
    const size = 15;
    const board = line(
      size,
      [
        [7, 5],
        [7, 6],
      ],
      B
    );
    const move = mediumMove(board, size, W);
    expect([idx(size, 7, 4), idx(size, 7, 7)]).toContain(move);
  });

  it('medium and hard take an immediate win and block an immediate loss', () => {
    const size = 15;
    // W can win at (7,3) → both tiers must take it
    let board = line(
      size,
      [
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 7],
      ],
      W
    );
    expect(mediumMove(board, size, W)).toBe(idx(size, 7, 3));
    expect(hardMove(board, size, W, 3)).toBe(idx(size, 7, 3));
    // B is about to win at (7,3) → both tiers must block there
    board = line(
      size,
      [
        [7, 4],
        [7, 5],
        [7, 6],
        [7, 7],
      ],
      B
    );
    expect(mediumMove(board, size, W)).toBe(idx(size, 7, 3));
    expect(hardMove(board, size, W, 3)).toBe(idx(size, 7, 3));
  });
});
