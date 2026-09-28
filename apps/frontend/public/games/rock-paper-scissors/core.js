/**
 * ============================================================================
 * core.js — Rock Paper Scissors, best-of-5 (pure model, no DOM — the surface)
 * ============================================================================
 * plan/games/07-rock-paper-scissors.md. Same family split: the pure model lives
 * here (jest suite: src/__tests__/games-rock-paper-scissors-core.test.ts),
 * game.js is the UI shell, the duel backend resolves every round server-side
 * and reveals both picks TOGETHER (no second-mover cheating).
 *
 * state = { wins: [me, them], history: [myThrow...], lastRound: { you, them,
 * result } | null, target: 3 }
 * ============================================================================
 */

export const MOVES = ['R', 'P', 'S']; // rock, paper, scissors
export const LABELS = { R: 'Rock', P: 'Paper', S: 'Scissors' };
export const GLYPHS = { R: '✊', P: '✋', S: '✌️' };
export const DEFAULT_TARGET = 3; // first to three round wins

/** Does `a` beat `b`? rock>scissors, paper>rock, scissors>paper */
export function beats(a, b) {
  return (a === 'R' && b === 'S') || (a === 'P' && b === 'R') || (a === 'S' && b === 'P');
}

/** Round result from a's perspective: 'a' | 'b' | 'tie' */
export function roundResult(a, b) {
  if (a === b) return 'tie';
  return beats(a, b) ? 'a' : 'b';
}

export function createState(target = DEFAULT_TARGET) {
  return { wins: [0, 0], history: [], lastRound: null, target };
}

/**
 * Play one round: resolve, score, and record it. `you` is the perspective of
 * the device (state.wins[0]); `result` names the winner as 'you' | 'them' | 'tie'.
 */
export function applyRound(state, you, them) {
  const raw = roundResult(you, them);
  const result = raw === 'a' ? 'you' : raw === 'b' ? 'them' : 'tie';
  const wins = [...state.wins];
  if (result === 'you') wins[0] += 1;
  else if (result === 'them') wins[1] += 1;
  return {
    state: {
      ...state,
      wins,
      history: [...state.history, you].slice(-24), // for the pattern AIs
      lastRound: { you, them, result },
    },
    result,
  };
}

export function isMatchWon(wins, target = DEFAULT_TARGET) {
  return wins[0] >= target || wins[1] >= target;
}

/* ---- AI picking -------------------------------------------------------------- */

const randomMove = (rand) => MOVES[Math.floor(rand() * MOVES.length)];

/** The move that beats `throw` (used to punish predictable humans). */
export function counterTo(throw_) {
  return throw_ === 'R' ? 'P' : throw_ === 'P' ? 'S' : 'R';
}

/** Easy AI — flat random. */
export function easyPick(history, rand = Math.random) {
  void history;
  return randomMove(rand);
}

/** Medium AI — counts the human's throws and counters the favourite. */
export function mediumPick(history, rand = Math.random) {
  if (history.length < 2) return randomMove(rand);
  const counts = { R: 0, P: 0, S: 0 };
  for (const t of history) counts[t] += 1;
  const [top] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  // 25% noise so it is beatable
  if (rand() < 0.25 || counts[top] / history.length < 0.45) return randomMove(rand);
  return counterTo(top);
}

/** Hard AI — first-order Markov: predicts the next throw from the last one. */
export function hardPick(history, rand = Math.random) {
  if (history.length < 4) return mediumPick(history, rand);
  const last = history[history.length - 1];
  const transitions = { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } };
  for (let i = 1; i < history.length; i++) {
    transitions[history[i - 1]][history[i]] += 1;
  }
  const row = transitions[last];
  const [predicted, count] = Object.entries(row).sort((a, b) => b[1] - a[1])[0];
  // trust the pattern only when it has shown up at least twice
  if (count < 2 || rand() < 0.15) return randomMove(rand);
  return counterTo(predicted);
}

export function aiPick(history, difficulty, rand = Math.random) {
  if (difficulty === 'hard') return hardPick(history, rand);
  if (difficulty === 'medium') return mediumPick(history, rand);
  return easyPick(history, rand);
}
