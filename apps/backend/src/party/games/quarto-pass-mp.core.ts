/**
 * Quarto Pass MP (T31 3P + F31 4P, ONE core) — PURE core, backend-owned.
 *
 * The 4x4 board of 16 unique pieces — pass the piece, they place it. Each
 * turn: place the piece you were handed, then hand a new piece to the NEXT
 * seat. First to complete a line of four sharing any attribute (colour,
 * shape, height, top) wins.
 *
 * Piece ids 1..16: bits of (id - 1) = [colour, shape, height, top].
 * EMPTY-BOARD: pure board game — no words, no served content. All public.
 */

export interface QpState {
  /** Board cells: 0 empty, else piece id. */
  board: number[];
  /** Piece the current seat must place, 0 = none (they must hand instead). */
  hand: number;
  turn: number;
  seatCount: number;
  lastAction:
    | { kind: 'place'; seat: number; piece: number; idx: number }
    | { kind: 'hand'; seat: number; piece: number }
    | null;
  moveCount: number;
  phase: 'playing' | 'finished';
  winnerSeat: number | null;
}
export interface QpPlacement {
  seat: number;
  rank: number;
}

export function qpInitialState(seatCount: number): QpState {
  return {
    board: new Array(16).fill(0) as number[],
    hand: 0, // seat 0 starts by handing a piece
    turn: 0,
    seatCount,
    lastAction: null,
    moveCount: 0,
    phase: 'playing',
    winnerSeat: null,
  };
}

/** The four binary attributes of a piece id (1..16). */
export function qpAttrs(id: number): number[] {
  const v = id - 1;
  return [v & 1, (v >> 1) & 1, (v >> 2) & 1, (v >> 3) & 1];
}

const QP_LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < 4; r++) lines.push([0, 1, 2, 3].map((c) => r * 4 + c));
  for (let c = 0; c < 4; c++) lines.push([0, 1, 2, 3].map((r) => r * 4 + c));
  lines.push([0, 5, 10, 15]);
  lines.push([3, 6, 9, 12]);
  return lines;
})();

function qpPieceOnBoard(board: number[], id: number): boolean {
  return board.indexOf(id) >= 0;
}

export function qpValidateMove(state: QpState, seat: number, move: unknown): string | null {
  if (state.phase === 'finished') return 'This table has finished.';
  if (state.turn !== seat) return 'Not your turn.';
  const m = move as { place?: unknown; hand?: unknown } | null;
  if (!m || typeof m !== 'object') return 'Send { place } or { hand }.';
  if (state.hand !== 0) {
    if (!Number.isInteger(m.place)) return 'Place the piece you were handed: { place }.';
    const idx = m.place as number;
    if (idx < 0 || idx > 15) return 'That cell is off the board.';
    if (state.board[idx] !== 0) return 'That cell is taken.';
    return null;
  }
  if (!Number.isInteger(m.hand)) return 'Hand a piece to the next player: { hand }.';
  const pid = m.hand as number;
  if (pid < 1 || pid > 16) return 'Pieces are numbered 1-16.';
  if (qpPieceOnBoard(state.board, pid) || pid === state.hand)
    return 'That piece is already on the board.';
  return null;
}

export function qpApplyMove(state: QpState, seat: number, move: unknown): QpState {
  const m = move as { place?: number; hand?: number };
  if (state.hand !== 0 && Number.isInteger(m.place)) {
    const idx = m.place as number;
    const board = state.board.slice();
    board[idx] = state.hand;
    const piece = state.hand;
    let phase: 'playing' | 'finished' = state.phase;
    let winnerSeat: number | null = state.winnerSeat;
    if (qpLineAt(board, idx)) {
      phase = 'finished';
      winnerSeat = seat;
    } else if (board.every((v) => v !== 0)) {
      phase = 'finished';
      winnerSeat = null; // all placed, no line — shared draw
    }
    return {
      ...state,
      board,
      hand: 0, // the same seat now hands the next piece
      lastAction: { kind: 'place', seat, piece, idx },
      moveCount: state.moveCount + 1,
      phase,
      winnerSeat,
    };
  }
  const pid = m.hand as number;
  return {
    ...state,
    hand: pid,
    turn: (seat + 1) % state.seatCount,
    lastAction: { kind: 'hand', seat, piece: pid },
    moveCount: state.moveCount + 1,
  };
}

function qpLineAt(board: number[], idx: number): boolean {
  for (const line of QP_LINES) {
    if (!line.includes(idx)) continue;
    const ids = line.map((i) => board[i]);
    if (ids.some((v) => v === 0)) continue;
    const attrs = ids.map((id) => qpAttrs(id));
    for (let a = 0; a < 4; a++) {
      const bit = attrs[0][a];
      if (attrs.every((x) => x[a] === bit)) return true;
    }
  }
  return false;
}

export function qpIsOver(state: QpState): boolean {
  return state.phase === 'finished';
}

export function qpWinner(state: QpState): number | null {
  return state.winnerSeat;
}

export function qpPlacement(state: QpState): QpPlacement[] {
  const rows = Array.from({ length: state.seatCount }, (_, seat) => ({ seat }));
  const win = state.winnerSeat;
  rows.sort((x, y) => {
    if (win !== null) {
      if (x.seat === win) return -1;
      if (y.seat === win) return 1;
    }
    return x.seat - y.seat;
  });
  return rows.map((o, i) => ({ seat: o.seat, rank: i + 1 }));
}

/* ------------------------------- bots ------------------------------- */

/** Count of empty cells where this piece would complete a shared line. */
function qpCompletions(board: number[], pid: number): number {
  let count = 0;
  for (let idx = 0; idx < 16; idx++) {
    if (board[idx] !== 0) continue;
    const sim = board.slice();
    sim[idx] = pid;
    if (qpLineAt(sim, idx)) count += 1;
  }
  return count;
}

export function qpBotMove(state: QpState, seat: number, tier: 'easy' | 'medium' | 'hard'): unknown {
  void seat;
  const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  if (state.hand !== 0) {
    // Place: take a winning cell if one exists.
    const empties: number[] = [];
    for (let idx = 0; idx < 16; idx++) {
      if (state.board[idx] === 0) empties.push(idx);
    }
    for (const idx of empties) {
      const sim = state.board.slice();
      sim[idx] = state.hand;
      if (qpLineAt(sim, idx)) return { place: idx };
    }
    if (tier === 'easy') return { place: pick(empties) };
    // Medium/hard: avoid cells that complete a line for any piece (a gift
    // to the next player — they will be handed SOMETHING; steer clear of
    // obviously "hot" cells: those where some piece would finish a line).
    const scored = empties.map((idx) => {
      let hot = 0;
      for (let pid = 1; pid <= 16; pid++) {
        if (qpPieceOnBoard(state.board, pid)) continue;
        if (pid === state.hand) continue;
        const sim = state.board.slice();
        sim[idx] = state.hand;
        // does placing HERE create a 3-in-line with 1 gap that pid fills?
        for (const line of QP_LINES) {
          if (!line.includes(idx)) continue;
          const filled = line.map((i) => sim[i]);
          const empt = filled.filter((v) => v === 0).length;
          if (empt !== 1) continue;
          // does pid fit the other three?
          const others = line.map((i) => sim[i]).filter((v) => v !== 0);
          const attrs = others.map((id) => qpAttrs(id));
          for (let a = 0; a < 4; a++) {
            const bit = attrs[0][a];
            if (attrs.every((x) => x[a] === bit) && qpAttrs(pid)[a] === bit) {
              hot += 1;
            }
          }
        }
      }
      return { idx, hot };
    });
    scored.sort((x, y) => x.hot - y.hot);
    const best = scored.filter((s) => s.hot === scored[0].hot);
    return { place: pick(best).idx };
  }
  // Hand: pick a piece that does NOT let the receiver win immediately.
  const avail: number[] = [];
  for (let pid = 1; pid <= 16; pid++) {
    if (!qpPieceOnBoard(state.board, pid)) avail.push(pid);
  }
  if (tier === 'easy') return { hand: pick(avail) };
  const scored = avail.map((pid) => ({ pid, danger: qpCompletions(state.board, pid) }));
  scored.sort((x, y) => x.danger - y.danger);
  const best = scored.filter((s) => s.danger === scored[0].danger);
  return { hand: pick(best).pid };
}
