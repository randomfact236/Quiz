/**
 * quad-oxo core (frontend copy) — MUST stay byte-compatible in behavior with
 * apps/backend/src/party/games/quad-oxo.core.ts (the adapter's source of
 * truth). The backend validates every move; this copy exists so the static
 * page can compute legal-move hints and bot-free hot-seat play offline.
 *
 * Empty-board rule: the grid starts empty; every mark is a player decision.
 */
(function () {
  'use strict';

  const CELLS = 25;
  const SYMBOLS = ['A', 'B', 'C', 'D'];

  const LINES = (() => {
    const lines = [];
    const idx = (r, c) => r * 5 + c;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c <= 1; c++)
        lines.push([idx(r, c), idx(r, c + 1), idx(r, c + 2), idx(r, c + 3)]);
    }
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r <= 1; r++)
        lines.push([idx(r, c), idx(r + 1, c), idx(r + 2, c), idx(r + 3, c)]);
    }
    for (let r = 0; r <= 1; r++) {
      for (let c = 0; c <= 1; c++)
        lines.push([idx(r, c), idx(r + 1, c + 1), idx(r + 2, c + 2), idx(r + 3, c + 3)]);
    }
    for (let r = 0; r <= 1; r++) {
      for (let c = 3; c <= 4; c++)
        lines.push([idx(r, c), idx(r + 1, c - 1), idx(r + 2, c - 2), idx(r + 3, c - 3)]);
    }
    return lines;
  })();

  function legalMoves(state) {
    const out = [];
    for (let i = 0; i < CELLS; i++) if (state.cells[i] === null) out.push(i);
    return out;
  }

  function validateMove(state, cell) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) return 'Cell out of range.';
    if (state.cells[cell] !== null) return 'That cell is taken.';
    return null;
  }

  function applyMove(state, seat, cell) {
    const cells = state.cells.slice();
    cells[cell] = SYMBOLS[seat] || 'A';
    return { ...state, cells };
  }

  function winningLine(state, seat) {
    const sym = SYMBOLS[seat];
    if (!sym) return null;
    for (const line of LINES) {
      if (line.every((i) => state.cells[i] === sym)) return line;
    }
    return null;
  }

  function isFull(state) {
    return state.cells.every((c) => c !== null);
  }

  /** Pure AI pick — mirrors the backend's quadAiMove tiers. */
  function aiMove(state, seat, tier) {
    const legal = legalMoves(state);
    if (legal.length === 0) return -1;
    const sym = SYMBOLS[seat];

    if (tier === 'easy') {
      const win = legal.find((c) => winningLine(applyMove(state, seat, c), seat) !== null);
      if (win !== undefined && (seat + legal.length) % 2 === 0) return win;
      return legal[(seat * 7 + legal.length * 3) % legal.length];
    }

    const win = legal.find((c) => winningLine(applyMove(state, seat, c), seat) !== null);
    if (win !== undefined) return win;

    const threats = [];
    for (const line of LINES) {
      const counts = new Map();
      let empty = -1;
      for (const i of line) {
        const v = state.cells[i];
        if (v === null) empty = i;
        else counts.set(v, (counts.get(v) || 0) + 1);
      }
      if (empty >= 0 && counts.size === 1) {
        const [who, n] = [...counts.entries()][0];
        if (n === 3 && who !== sym) threats.push(empty);
      }
    }
    if (threats.length > 0) return threats[0];

    let best = legal[0];
    let bestScore = -1;
    for (const c of legal) {
      let score = 0;
      for (const line of LINES) {
        if (!line.includes(c)) continue;
        const own = line.filter((i) => state.cells[i] === sym).length;
        if (own >= 1) score += own * own;
        if (tier === 'hard') {
          const rivals = line.filter(
            (i) => state.cells[i] !== null && state.cells[i] !== sym
          ).length;
          if (rivals >= 2) score += 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        best = c;
      }
    }
    return best;
  }

  function anyWinningSeat(state) {
    for (let seat = 0; seat < SYMBOLS.length; seat++) {
      if (winningLine(state, seat) !== null) return seat;
    }
    return null;
  }

  function placement(seatsInPlay, winnerSeat) {
    const order = seatsInPlay.slice().sort((a, b) => a - b);
    if (winnerSeat === null) return order.map((seat) => ({ seat, rank: 1 }));
    return order.map((seat) => ({ seat, rank: seat === winnerSeat ? 1 : 2 }));
  }

  window.QUADOXO_CORE = {
    CELLS,
    SYMBOLS,
    LINES,
    legalMoves,
    validateMove,
    applyMove,
    winningLine,
    anyWinningSeat,
    isFull,
    placement,
    aiMove,
  };
})();
