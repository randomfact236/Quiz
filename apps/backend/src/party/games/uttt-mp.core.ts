/**
 * Ultimate TTT MP (T13 3P + F2 4P, ONE core) — PURE core, backend-owned.
 *
 * 9 mini 3×3 boards (81 cells), 3 or 4 seats. SEND RULE: the cell you play
 * (row, col inside the mini-board) forces the NEXT seat clockwise into the
 * matching mini-board; if that board is decided they play anywhere (free
 * move). Take THREE mini-boards in a macro line to win; all boards decided
 * without a macro line = shared result. Empty-board: all 81 cells start open.
 */

export interface UtttState {
  /** 81 cells: seat index + 1, or 0 empty. cell = board * 9 + inner. */
  cells: number[];
  /** Per mini-board: seat index + 1 when won, else 0. */
  boardOwner: number[];
  /** Per mini-board: true once won OR full (no more plays there). */
  boardDone: boolean[];
  /** Forced mini-board for the current turn; -1 = free move. */
  activeBoard: number;
  turn: number;
  seatCount: number;
}

export const UTTT_LINES: readonly (readonly number[])[] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function utttInitialState(seatCount: number): UtttState {
  return {
    cells: Array<number>(81).fill(0),
    boardOwner: Array<number>(9).fill(0),
    boardDone: Array<boolean>(9).fill(false),
    activeBoard: -1, // opening move: anywhere
    turn: 0,
    seatCount,
  };
}

export function utttLegalCells(state: UtttState): number[] {
  const out: number[] = [];
  for (let b = 0; b < 9; b++) {
    if (state.boardDone[b]) continue;
    if (state.activeBoard >= 0 && state.activeBoard !== b) continue;
    for (let i = 0; i < 9; i++) {
      if (state.cells[b * 9 + i] === 0) out.push(b * 9 + i);
    }
  }
  return out;
}

export function utttValidateMove(state: UtttState, cell: number): string | null {
  if (!Number.isInteger(cell) || cell < 0 || cell >= 81) return 'Cell out of range.';
  const board = Math.floor(cell / 9);
  if (state.boardDone[board]) return 'That mini-board is already decided.';
  if (state.cells[cell] !== 0) return 'That cell is taken.';
  if (state.activeBoard >= 0 && state.activeBoard !== board) {
    return 'The send-rule forces you into a different mini-board.';
  }
  return null;
}

function miniWin(state: UtttState, board: number, seat: number): boolean {
  const base = board * 9;
  return UTTT_LINES.some((line) => line.every((i) => state.cells[base + i] === seat + 1));
}

function miniFull(state: UtttState, board: number): boolean {
  const base = board * 9;
  return state.cells.slice(base, base + 9).every((v) => v !== 0);
}

export function utttApplyMove(state: UtttState, seat: number, cell: number): UtttState {
  const cells = state.cells.slice();
  cells[cell] = seat + 1;
  const board = Math.floor(cell / 9);
  const boardOwner = state.boardOwner.slice();
  const boardDone = state.boardDone.slice();
  if (!boardDone[board]) {
    if (miniWin({ ...state, cells }, board, seat)) {
      boardOwner[board] = seat + 1;
      boardDone[board] = true;
    } else if (miniFull({ ...state, cells }, board)) {
      boardDone[board] = true; // drawn mini-board, ownerless
    }
  }
  const inner = cell % 9;
  const nextBoard = boardDone[inner] ? -1 : inner;
  return {
    cells,
    boardOwner,
    boardDone,
    activeBoard: nextBoard,
    turn: (seat + 1) % state.seatCount,
    seatCount: state.seatCount,
  };
}

function macroWinner(boardOwner: number[]): number | null {
  for (const line of UTTT_LINES) {
    const v = boardOwner[line[0]];
    if (v !== 0 && line.every((b) => boardOwner[b] === v)) return v - 1;
  }
  return null;
}

export function utttIsOver(state: UtttState): boolean {
  return macroWinner(state.boardOwner) !== null || state.boardDone.every((d) => d);
}

export function utttWinner(state: UtttState): number | null {
  return macroWinner(state.boardOwner);
}

/** Placement: macro-line winner 1st; everyone else shares 2nd. */
export function utttPlacement(
  seatCount: number,
  winnerSeat: number | null
): { seat: number; rank: number }[] {
  const out: { seat: number; rank: number }[] = [];
  for (let s = 0; s < seatCount; s++) {
    out.push({ seat: s, rank: winnerSeat === null ? 1 : s === winnerSeat ? 1 : 2 });
  }
  return out;
}

/** AI: win mini-board → block send-trap → prefer centre of open boards. */
export function utttAiMove(
  state: UtttState,
  seat: number,
  tier: 'easy' | 'medium' | 'hard'
): number {
  const legal = utttLegalCells(state);
  if (legal.length === 0) return -1;

  const wouldTakeBoard = (cell: number, s: number): boolean => {
    const next = utttApplyMove(state, s, cell);
    const board = Math.floor(cell / 9);
    return next.boardOwner[board] === s + 1;
  };

  if (tier === 'easy') {
    const win = legal.find((c) => wouldTakeBoard(c, seat));
    if (win !== undefined && legal.length % 2 === 0) return win;
    return legal[(legal.length * 7 + seat * 3) % legal.length];
  }

  // 1) Take a mini-board now.
  const win = legal.find((c) => wouldTakeBoard(c, seat));
  if (win !== undefined) return win;

  // 2) Don't send the next seat into a board they could take with one move:
  //    prefer cells whose target board is decided/hard to win.
  const safe = legal.filter((c) => {
    const target = c % 9;
    if (state.boardDone[target]) return true;
    // target open: does the NEXT seat have an immediate take there?
    return false; // conservative: any open target is a potential gift
  });
  const pool = tier === 'hard' && safe.length > 0 ? safe : legal;

  // 3) Prefer centre cell of the centre board, then any centre.
  const centreFirst = pool.slice().sort((a, b) => {
    const score = (c: number): number => {
      const inner = c % 9;
      const bonus = inner === 4 ? 4 : [0, 2, 6, 8].includes(inner) ? 1 : 2;
      return (Math.floor(c / 9) === 4 ? 2 : 0) + bonus;
    };
    return score(b) - score(a);
  });
  return centreFirst[0];
}
