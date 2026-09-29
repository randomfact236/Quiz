/**
 * ============================================================================
 * core.js — Ludo (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/42-ludo.md. Four colours race home around the standard cross.
 *
 * BOARD — there is no 2-D array here, because Ludo's board is not a grid: it
 * is 4 TRACKS of 51 squares plus 4 home columns of 6. Everything is expressed
 * as { colour, index } and the geometry lives in one exported table, so the
 * same rules drive the UI, the AI and the server. That is the single decision
 * that keeps this model honest — the alternative (scattering row/col
 * arithmetic everywhere) is exactly how the safe squares and home entries get
 * out of step.
 *
 *   TRACK_LEN  51   the long way round, from a colour's start square home
 *   HOME_LEN    6   the private column, entered at track index 50
 *
 * THE DIE IS AN INPUT. Nothing here generates a roll: the server rolls with
 * crypto.randomInt (the 2026-09-29 luck-tier decision) and the client only
 * renders it. Keeping the model pure is what makes it testable at all.
 * ============================================================================
 */

export const TRACK_LEN = 51;
export const HOME_LEN = 6;

/** 1..4 — 🔴 🔵 🟡 🟢, in the order their start squares appear on the track. */
export const RED = 1, BLUE = 2, YELLOW = 3, GREEN = 4;
export const COLOURS = [RED, BLUE, YELLOW, GREEN];
export const COLOUR_NAME = { 1: '🔴 Red', 2: '🔵 Blue', 3: '🟡 Yellow', 4: '🟢 Green' };
export const START_YARD = 0; // a pawn's position before it is on the track

/** Each colour's start square, as a track index. These are the SAFE squares. */
export const START_INDEX = { [RED]: 0, [BLUE]: 13, [YELLOW]: 26, [GREEN]: 39 };

/** The six safe squares: the four starts plus the two crossing points. */
export const SAFE_INDICES = [0, 8, 13, 21, 26, 34, 39, 47];

export function otherColours(colour) {
  return COLOURS.filter((c) => c !== colour);
}

/**
 * Where a pawn sits, in terms a board renderer can use:
 *  { where: 'yard' } | { where: 'track', index } | { where: 'home', index }
 */
export function positionOf(pos) {
  if (pos === START_YARD) return { where: 'yard' };
  if (pos >= 1 && pos <= TRACK_LEN) return { where: 'track', index: pos - 1 };
  return { where: 'home', index: pos - TRACK_LEN - 1 };
}

export function isYard(pos) {
  return pos === START_YARD;
}

export function isTrack(pos) {
  return pos >= 1 && pos <= TRACK_LEN;
}

export function isHome(pos) {
  return pos > TRACK_LEN && pos <= TRACK_LEN + HOME_LEN;
}

export function isFinished(pos) {
  return pos === TRACK_LEN + HOME_LEN;
}

/** Is this track square safe from capture? */
export function isSafe(index) {
  return SAFE_INDICES.indexOf(index) !== -1;
}

/** A pawn's total number of steps from the yard to its finished square. */
export const FULL_PITCH = TRACK_LEN + HOME_LEN; // 57

/* ---- the game state -------------------------------------------------------- */

/**
 * A game is: pawns (4 per colour) + whose turn + the rolls so far.
 * The roll is passed to every call, never stored as state, so a caller cannot
 * accidentally reuse one.
 *
 * `state = { pawns: {1: number[], 2: ...}, turn, sixes, captured: {1: n,...} }`
 */
export function createGame() {
  return {
    pawns: {
      [RED]: [START_YARD, START_YARD, START_YARD, START_YARD],
      [BLUE]: [START_YARD, START_YARD, START_YARD, START_YARD],
      [YELLOW]: [START_YARD, START_YARD, START_YARD, START_YARD],
      [GREEN]: [START_YARD, START_YARD, START_YARD, START_YARD],
    },
    turn: RED,
    /** consecutive sixes by the player to move; three forfeits the turn */
    sixes: 0,
    captured: { [RED]: 0, [BLUE]: 0, [YELLOW]: 0, [GREEN]: 0 },
  };
}

export function cloneGame(game) {
  return {
    pawns: {
      [RED]: game.pawns[RED].slice(),
      [BLUE]: game.pawns[BLUE].slice(),
      [YELLOW]: game.pawns[YELLOW].slice(),
      [GREEN]: game.pawns[GREEN].slice(),
    },
    turn: game.turn,
    sixes: game.sixes,
    captured: { ...game.captured },
  };
}

/** The track index a pawn currently occupies, or null if it is not on the track. */
export function trackIndexOf(game, colour, pawn) {
  const pos = game.pawns[colour][pawn];
  return isTrack(pos) ? pos - 1 : null;
}

/** Every opponent pawn sitting on `index` right now. */
export function occupantsOf(game, index) {
  const out = [];
  for (const colour of COLOURS) {
    game.pawns[colour].forEach((pos, pawn) => {
      if (isTrack(pos) && pos - 1 === index) out.push({ colour, pawn });
    });
  }
  return out;
}

/**
 * Every move `colour` can make with `roll` — an array of
 * { pawn, to, captures: [{colour, pawn}], finishes: bool, bringsOut: bool }.
 * An empty array means the roll is dead: the turn passes.
 */
export function legalMoves(game, colour, roll) {
  if (roll < 1 || roll > 6) return [];
  const moves = [];

  game.pawns[colour].forEach((pos, pawn) => {
    if (isFinished(pos)) return; // already home, done

    if (isYard(pos)) {
      // only a six brings a pawn out
      if (roll !== 6) return;
      // the start square must be free of everyone, or you may not enter
      const start = START_INDEX[colour];
      const blocking = occupantsOf(game, start).filter((o) => o.colour !== colour);
      if (blocking.length > 0) return;
      moves.push({ pawn, to: 1, captures: [], finishes: false, bringsOut: true });
      return;
    }

    if (isHome(pos)) {
      // inside the private column a pawn only moves forward, and only
      // EXACTLY the rolled number — the classic house rule
      const target = pos + roll;
      if (target > TRACK_LEN + HOME_LEN) return; // would overshoot home
      moves.push({
        pawn,
        to: target,
        captures: [],
        finishes: target === TRACK_LEN + HOME_LEN,
        bringsOut: false,
      });
      return;
    }

    // on the track
    const target = pos + roll;

    // entering the home column: the roll must land EXACTLY on its first square
    if (target > TRACK_LEN) {
      if (target !== TRACK_LEN + 1) return; // overshoot — not allowed
      moves.push({ pawn, to: target, captures: [], finishes: false, bringsOut: false });
      return;
    }

    const index = target - 1;
    const there = occupantsOf(game, index);
    // your own pawn blocks you
    if (there.some((o) => o.colour === colour)) return;
    const enemies = there.filter((o) => o.colour !== colour);
    // a safe square is untouchable while anyone stands on it
    if (isSafe(index) && enemies.length > 0) return;
    // TWO OR MORE enemy pawns on one square is a BLOCKADE, not a double
    // capture — the square cannot be entered at all
    if (enemies.length > 1) return;
    // exactly one lone enemy pawn is captured
    moves.push({ pawn, to: target, captures: enemies, finishes: false, bringsOut: false });
  });

  return moves;
}

/** Apply a move, returning the next game plus what happened. */
export function applyMove(game, colour, move, roll) {
  const next = cloneGame(game);
  const before = next.pawns[colour][move.pawn];
  next.pawns[colour][move.pawn] = move.to;
  for (const taken of move.captures) {
    next.pawns[taken.colour][taken.pawn] = START_YARD;
    next.captured[colour] += 1;
  }
  // a six — or bringing a pawn out, which only a six can do — grants another roll
  const extraTurn = roll === 6 || move.bringsOut;
  return {
    game: next,
    captured: move.captures,
    finished: move.finishes,
    from: before,
    to: move.to,
    extraTurn,
  };
}

/* ---- turns and ending --------------------------------------------------------- */

/**
 * Play a turn: apply the move, then decide whose turn is next. Returns
 * `{ game, over, winner, placement, extraTurn }`.
 */
export function playTurn(game, colour, move, roll) {
  const result = applyMove(game, colour, move, roll);
  const next = result.game;
  // a six grants another roll — the flag is read from the roll the caller used
  next.sixes = result.extraTurn ? game.sixes + 1 : 0;

  if (next.sixes >= 3) {
    // three sixes in a row: the turn is forfeited
    next.turn = nextColour(colour);
    next.sixes = 0;
    return { ...result, game: next, over: false, winner: null, extraTurn: false };
  }
  if (result.extraTurn) {
    next.turn = colour; // the same player rolls again
    return { ...result, game: next, over: false, winner: null, extraTurn: true };
  }

  const placed = finishedFor(next, colour);
  if (placed) {
    return {
      ...result,
      game: next,
      over: true,
      winner: colour,
      placement: placed,
      extraTurn: false,
    };
  }
  next.turn = nextColour(colour);
  return { ...result, game: next, over: false, winner: null, extraTurn: false };
}

function nextColour(colour) {
  const i = COLOURS.indexOf(colour);
  return COLOURS[(i + 1) % COLOURS.length];
}

/** 1 if `colour` has just finished (all four home), else null. */
export function finishedFor(game, colour) {
  return game.pawns[colour].every((p) => isFinished(p)) ? 1 : null;
}

export function isFinishedGame(game) {
  return COLOURS.some((c) => finishedFor(game, c));
}

export function pawnCounts(game) {
  const out = {};
  for (const colour of COLOURS) {
    out[colour] = {
      yard: game.pawns[colour].filter(isYard).length,
      track: game.pawns[colour].filter(isTrack).length,
      home: game.pawns[colour].filter(isHome).length,
      finished: game.pawns[colour].filter(isFinished).length,
    };
  }
  return out;
}

/* ---- evaluation ------------------------------------------------------------------ */

const HOME_BONUS = 40;
const CENTRE_BONUS = 8;

/** A progress read for the AI: how far each of this side's pawns has come. */
export function evaluate(game, colour) {
  let score = 0;
  for (const p of game.pawns[colour]) {
    if (isFinished(p)) score += 200;
    else if (isHome(p)) score += 100 + (p - TRACK_LEN) * HOME_BONUS;
    else if (isTrack(p)) {
      score += p * 4;
      // the middle of the track is where games are decided
      if (p >= 20 && p <= 32) score += CENTRE_BONUS;
    } else {
      score += 2; // still in the yard
    }
  }
  // having more pawns home is worth a lot
  const done = game.pawns[colour].filter(isFinished).length;
  score += done * 120;
  return score;
}

/* ---- AI ---------------------------------------------------------------------------- */

/**
 * Easy AI — always the first legal move, preferring to bring a pawn out on a
 * six (which is simply the first in a natural ordering, not a strategy).
 */
export function easyMove(game, colour, roll) {
  const moves = legalMoves(game, colour, roll);
  return moves.length > 0 ? moves[0] : null;
}

/**
 * Medium AI — one ply: finish a pawn, capture, bring one out on a six, then
 * the move that leaves this side furthest along.
 */
export function mediumMove(game, colour, roll) {
  const moves = legalMoves(game, colour, roll);
  if (moves.length === 0) return null;
  const scored = moves
    .map((move) => {
      const after = cloneGame(game);
      after.pawns[colour][move.pawn] = move.to;
      for (const taken of move.captures) after.pawns[taken.colour][taken.pawn] = START_YARD;
      let s = evaluate(after, colour);
      if (move.finishes) s += 400;
      if (move.captures.length > 0) s += 150;
      if (move.bringsOut) s += 30;
      return { move, score: s };
    })
    .sort((a, b) => b.score - a.score);
  return scored[0].move;
}

/**
 * Hard AI — a shallow search over THIS roll only (the die is an input, so
 * there is nothing to branch on beyond the choices it makes). It looks ahead
 * over who moves next with a two-ply search, which is what makes it block a
 * capture instead of walking into one.
 */
export function search(game, colour, roll, options = {}) {
  const maxNodes = options.maxNodes ?? 20000;
  let nodes = 0;
  let aborted = false;

  function value(g, side, depth) {
    nodes++;
    if (nodes > maxNodes) {
      aborted = true;
      return evaluate(g, side) - evaluate(g, otherColours(side)[0]);
    }
    const moves = legalMoves(g, side, depth === 1 ? 6 : 3); // a plausible follow-up
    if (moves.length === 0) return -1000; // stuck: this is a bad position
    let best = -Infinity;
    for (const move of moves) {
      const after = cloneGame(g);
      after.pawns[side][move.pawn] = move.to;
      for (const taken of move.captures) after.pawns[taken.colour][taken.pawn] = START_YARD;
      let s = evaluate(after, side) - evaluate(after, otherColours(side)[0]);
      if (move.finishes) s += 400;
      if (move.captures.length > 0) s += 150;
      if (depth > 1) {
        // the opponent replies with a typical roll — block what they want
        s -= 0.4 * value(after, otherColours(side)[0], depth - 1);
      }
      if (s > best) best = s;
      if (aborted) break;
    }
    return best;
  }

  const moves = legalMoves(game, colour, roll);
  if (moves.length === 0) return null;
  let bestMove = moves[0];
  let bestValue = -Infinity;
  for (const move of moves) {
    const v = value(game, colour, 2) + (move.finishes ? 400 : 0) + (move.captures.length ? 150 : 0);
    if (v > bestValue) {
      bestValue = v;
      bestMove = move;
    }
  }
  return { move: bestMove, value: bestValue, nodes, aborted };
}

export function aiMove(game, colour, roll, difficulty, options = {}) {
  if (difficulty === 'hard') {
    const found = search(game, colour, roll, options);
    return found ? found.move : null;
  }
  if (difficulty === 'medium') return mediumMove(game, colour, roll);
  return easyMove(game, colour, roll);
}

/* ---- the wire ------------------------------------------------------------------------- */

/** Sanitise an untrusted pawns object. */
export function fromState(cells, turn) {
  const game = createGame();
  if (cells && typeof cells === 'object') {
    for (const colour of COLOURS) {
      const list = cells[colour] ?? cells[String(colour)];
      if (Array.isArray(list) && list.length === 4) {
        game.pawns[colour] = list.map((v) => {
          const n = Number(v) | 0;
          return n >= 0 && n <= FULL_PITCH ? n : START_YARD;
        });
      }
    }
  }
  const t = Number(turn) | 0;
  game.turn = COLOURS.indexOf(t) !== -1 ? t : RED;
  return game;
}
