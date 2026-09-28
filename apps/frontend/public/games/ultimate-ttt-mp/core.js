/**
 * ultimate-ttt-mp core (frontend copy) — mirrors uttt-mp.core.ts.
 */
(function () {
  'use strict';
  const LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  function initialState(seatCount) {
    return {
      cells: Array(81).fill(0),
      boardOwner: Array(9).fill(0),
      boardDone: Array(9).fill(false),
      activeBoard: -1,
      turn: 0,
      seatCount: seatCount,
    };
  }
  function legalCells(state) {
    const out = [];
    for (let b = 0; b < 9; b++) {
      if (state.boardDone[b]) continue;
      if (state.activeBoard >= 0 && state.activeBoard !== b) continue;
      for (let i = 0; i < 9; i++) if (state.cells[b * 9 + i] === 0) out.push(b * 9 + i);
    }
    return out;
  }
  function validateMove(state, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= 81) return 'Cell out of range.';
    const board = Math.floor(cell / 9);
    if (state.boardDone[board]) return 'That mini-board is already decided.';
    if (state.cells[cell] !== 0) return 'That cell is taken.';
    if (state.activeBoard >= 0 && state.activeBoard !== board)
      return 'The send-rule forces you elsewhere.';
    return null;
  }
  function miniWin(cells, board, seat) {
    const base = board * 9;
    return LINES.some(function (line) {
      return line.every(function (i) {
        return cells[base + i] === seat + 1;
      });
    });
  }
  function miniFull(cells, board) {
    for (let i = 0; i < 9; i++) if (cells[board * 9 + i] === 0) return false;
    return true;
  }
  function applyMove(state, seat, cell) {
    const cells = state.cells.slice();
    cells[cell] = seat + 1;
    const board = Math.floor(cell / 9);
    const boardOwner = state.boardOwner.slice();
    const boardDone = state.boardDone.slice();
    if (!boardDone[board]) {
      if (miniWin(cells, board, seat)) {
        boardOwner[board] = seat + 1;
        boardDone[board] = true;
      } else if (miniFull(cells, board)) {
        boardDone[board] = true;
      }
    }
    const inner = cell % 9;
    return {
      cells: cells,
      boardOwner: boardOwner,
      boardDone: boardDone,
      activeBoard: boardDone[inner] ? -1 : inner,
      turn: (seat + 1) % state.seatCount,
      seatCount: state.seatCount,
    };
  }
  function macroWinner(boardOwner) {
    for (const line of LINES) {
      const v = boardOwner[line[0]];
      if (
        v !== 0 &&
        line.every(function (b) {
          return boardOwner[b] === v;
        })
      )
        return v - 1;
    }
    return null;
  }
  function isOver(state) {
    return macroWinner(state.boardOwner) !== null || state.boardDone.every(Boolean);
  }
  function winner(state) {
    return macroWinner(state.boardOwner);
  }
  function placement(seatCount, winnerSeat) {
    const out = [];
    for (let s = 0; s < seatCount; s++)
      out.push({ seat: s, rank: winnerSeat === null ? 1 : s === winnerSeat ? 1 : 2 });
    return out;
  }
  window.UTTT_CORE = {
    LINES,
    initialState,
    legalCells,
    validateMove,
    applyMove,
    isOver,
    winner,
    placement,
  };
})();
