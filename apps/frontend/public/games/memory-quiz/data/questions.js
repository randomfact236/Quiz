/**
 * ============================================================================
 * Memory Quiz — data/questions.js (upgrade architecture §4.2)
 * ============================================================================
 * The question-type registry. Every question type is a plugin object; the
 * engine (core.js compose + game.js shell) never names a type — it iterates
 * this registry. Adding a type = one entry here + its invariants, nothing
 * else.
 *
 * Entry contract:
 *   id          stable string (level data references it)
 *   needs       'boardItem'  — consumes on-board items, or
 *               'spareItem'  — consumes one off-board spare (composer enforces)
 *   boardItems  how many on-board items one question needs (default 1; the
 *               swap exchange takes 2 — the extras arrive as ctx.extraItems)
 *   consumes    set by build: the emojis the question books (composer
 *               enforces no double-booking across a board's questions)
 *   spareCost   off-board spares this type eats per question entry (lint)
 *   answerUi    'grid'       — the player taps a board cell (`picked` = index)
 *               'candidates' — the player taps a candidate item (`picked` = item)
 *   build(ctx)  ctx = { board, level, item, rng } → question object (or null
 *               to force a generation retry); may attach `effect` — declarative
 *               board mutation the shell applies at question start (e.g.
 *               `{ kind: 'hideItem', cell }`), kept as data, not behavior
 *   banner(q)   { key, vars } for config.strings (game.js calls t())
 *   candidates(q) candidate items for answerUi 'candidates', else null
 *   resolve(q, picked, ctx) → { outcome, points, heartsLost }
 *               ctx = { streak, level, timeLeftMs, locale }
 *   truth(q)    [{ cell, item, pulse }] — the reveal the shell shows on miss
 *   invariants(board, q, level) throws on invalid generation (test surface)
 * ============================================================================
 */
import { itemName, pointsFor, sampleWith, shuffleWith } from '../core.js';

function nameOf(item, ctx) {
  return itemName(item, (ctx && ctx.locale) || 'en');
}

function onBoardItems(board) {
  return board.items.filter((it) => it !== null);
}

export const QUESTION_TYPES = {
  /* ---- where: "Where is the pizza?" — tap the cell holding it ------------- */
  where: {
    id: 'where',
    needs: 'boardItem',
    boardItems: 1,
    spareCost: 0,
    answerUi: 'grid',
    build({ board, item }) {
      return { type: 'where', item, cell: board.cells.indexOf(item), effect: null };
    },
    banner(q, ctx) {
      return { key: 'whereIs', vars: { item: nameOf(q.item, ctx) } };
    },
    candidates() {
      return null;
    },
    missMessage() {
      return { key: 'feedbackMissWhere' };
    },
    resolve(q, picked, ctx) {
      if (picked === q.cell) {
        return {
          outcome: 'hit',
          points: pointsFor(ctx.level, ctx.streak, ctx.timeLeftMs),
          heartsLost: 0,
        };
      }
      return { outcome: 'miss', points: 0, heartsLost: 1 };
    },
    truth(q) {
      return [{ cell: q.cell, item: q.item, pulse: true }];
    },
    invariants(board, q) {
      if (board.cells[q.cell] !== q.item)
        throw new Error('where: answer cell does not hold the item');
    },
  },

  /* ---- missing: "Which snack is missing?" — one item leaves the board ----- */
  missing: {
    id: 'missing',
    needs: 'boardItem',
    boardItems: 1,
    spareCost: (entry, level) => Math.max(0, level.candidates - 1),
    answerUi: 'candidates',
    build({ board, level, item, rng }) {
      const onBoard = new Set(onBoardItems(board).map((it) => it.emoji));
      const spares = board.pack.items.filter((it) => !onBoard.has(it.emoji));
      const distractors = sampleWith(rng, spares, level.candidates - 1);
      if (distractors.length < level.candidates - 1) return null;
      const cell = board.cells.indexOf(item);
      return {
        type: 'missing',
        item,
        cell,
        candidates: shuffleWith(rng, [item, ...distractors]),
        effect: { kind: 'hideItem', cell },
      };
    },
    banner() {
      return { key: 'whichMissing' };
    },
    candidates(q) {
      return q.candidates;
    },
    missMessage(q, ctx) {
      return { key: 'feedbackMissMissing', vars: { item: nameOf(q.item, ctx) } };
    },
    resolve(q, picked, ctx) {
      if (picked && picked.emoji === q.item.emoji) {
        return {
          outcome: 'hit',
          points: pointsFor(ctx.level, ctx.streak, ctx.timeLeftMs),
          heartsLost: 0,
        };
      }
      return { outcome: 'miss', points: 0, heartsLost: 1 };
    },
    truth(q, board) {
      return [{ cell: board.cells.indexOf(q.item), item: q.item, pulse: true }];
    },
    invariants(board, q, level) {
      if (q.candidates.length !== level.candidates)
        throw new Error('missing: wrong candidate count');
      if (!q.candidates.some((c) => c.emoji === q.item.emoji)) {
        throw new Error('missing: removed item not among candidates');
      }
      const onBoard = new Set(onBoardItems(board).map((it) => it.emoji));
      for (const cand of q.candidates) {
        if (cand.emoji !== q.item.emoji && onBoard.has(cand.emoji)) {
          throw new Error('missing: candidate is still on the board');
        }
      }
    },
  },

  /* ---- swap: "The taco moved! Where is it now?" — a phantom EXCHANGE of
          two items (grids are fully filled, so nothing moves into a blank);
          the canonical board never changes, so any later question still
          matches the memorized layout --------------------------------------- */
  swap: {
    id: 'swap',
    needs: 'boardItem',
    boardItems: 2, // consumes the moved item + its exchange partner
    spareCost: 0,
    answerUi: 'grid',
    build({ board, item, extraItems }) {
      const partner = extraItems[0];
      if (!partner) return null; // composer retries; lint caps questions per level
      return {
        type: 'swap',
        item,
        partner,
        from: board.cells.indexOf(item),
        to: board.cells.indexOf(partner),
        consumes: [item.emoji, partner.emoji],
        effect: null,
      };
    },
    banner(q, ctx) {
      return { key: 'movedWhere', vars: { item: nameOf(q.item, ctx) } };
    },
    candidates() {
      return null;
    },
    missMessage() {
      return { key: 'feedbackMissSwap' };
    },
    resolve(q, picked, ctx) {
      if (picked === q.to) {
        return {
          outcome: 'hit',
          points: pointsFor(ctx.level, ctx.streak, ctx.timeLeftMs),
          heartsLost: 0,
        };
      }
      return { outcome: 'miss', points: 0, heartsLost: 1 };
    },
    truth(q) {
      // the exchange: `item` now sits where its partner was and vice versa
      return [
        { cell: q.to, item: q.item, pulse: true },
        { cell: q.from, item: q.partner, pulse: false },
      ];
    },
    invariants(board, q) {
      if (board.cells[q.from] !== q.item) throw new Error('swap: `from` does not hold the item');
      if (board.cells[q.to] !== q.partner) throw new Error('swap: `to` does not hold the partner');
      if (q.from === q.to) throw new Error('swap: from === to');
    },
  },

  /* ---- oddOne: "Which snack was NOT on the board?" — the answer is an
          off-board spare hiding among on-board items (the deliberate
          inverse of the missing rule) --------------------------------------- */
  oddOne: {
    id: 'oddOne',
    needs: 'spareItem',
    spareCost: 1,
    answerUi: 'candidates',
    build({ board, item, rng }) {
      const others = onBoardItems(board).filter((it) => it.emoji !== item.emoji);
      const distractors = sampleWith(rng, others, 3);
      if (distractors.length < 3) return null;
      return {
        type: 'oddOne',
        item,
        candidates: shuffleWith(rng, [item, ...distractors]),
        effect: null,
      };
    },
    banner() {
      return { key: 'oddOne' };
    },
    candidates(q) {
      return q.candidates;
    },
    missMessage(q, ctx) {
      return { key: 'feedbackMissOddOne', vars: { item: nameOf(q.item, ctx) } };
    },
    resolve(q, picked, ctx) {
      if (picked && picked.emoji === q.item.emoji) {
        return {
          outcome: 'hit',
          points: pointsFor(ctx.level, ctx.streak, ctx.timeLeftMs),
          heartsLost: 0,
        };
      }
      return { outcome: 'miss', points: 0, heartsLost: 1 };
    },
    truth() {
      return []; // the answer was never on the board — the feedback text names it
    },
    invariants(board, q) {
      const onBoard = new Set(onBoardItems(board).map((it) => it.emoji));
      if (onBoard.has(q.item.emoji)) throw new Error('oddOne: answer is on the board');
      if (q.candidates.length !== 4)
        throw new Error('oddOne: needs 3 on-board distractors + answer');
      const offBoard = q.candidates.filter((c) => !onBoard.has(c.emoji));
      if (offBoard.length !== 1 || offBoard[0].emoji !== q.item.emoji) {
        throw new Error('oddOne: exactly one off-board candidate (the answer) required');
      }
    },
  },
};
