/**
 * ============================================================================
 * core.js — Pig Dice, push-your-luck (pure model, no DOM — the test surface)
 * ============================================================================
 * plan/games/05-pig-dice.md. Same family split: the pure model lives here
 * (jest suite: src/__tests__/games-pig-dice-core.test.ts), game.js is the UI
 * shell, the duel backend mirrors it server-side in TS and generates every roll
 * itself (crypto RNG) so neither client can influence the die.
 *
 * Rules: roll 2–6 → pips join the turn pot and you roll again; roll a 1 →
 * the pot is lost and the turn passes; Hold → the pot banks and the turn
 * passes. First to reach the target (banked score) wins.
 * ============================================================================
 */

export const TARGETS = [50, 100]; // quick / standard
export const DEFAULT_TARGET = 100;

/** state = { scores: [red, blue], pot, turn: 1 | 2, target } */
export function createState(target = DEFAULT_TARGET) {
  return { scores: [0, 0], pot: 0, turn: 1, target };
}

export const other = (turn) => (turn === 1 ? 2 : 1);

/**
 * Roll the die. Returns the next state plus what happened:
 * { state, pips, busted } — busted = the pot was lost and the turn passed.
 * A roll never passes the turn on its own; holding does.
 */
export function applyRoll(state, pips) {
  const p = Math.max(1, Math.min(6, Math.trunc(pips)));
  if (p === 1) {
    return {
      state: { ...state, pot: 0, turn: other(state.turn) },
      pips: 1,
      busted: true,
    };
  }
  return {
    state: { ...state, pot: state.pot + p },
    pips: p,
    busted: false,
  };
}

/** Hold: bank the pot, pass the turn, and finish if the target is reached. */
export function applyHold(state) {
  const scores = [...state.scores];
  scores[state.turn - 1] += state.pot;
  const next = { ...state, scores, pot: 0, turn: other(state.turn) };
  return { state: next, banked: state.pot, won: scores[state.turn - 1] >= state.target };
}

/** Has the player on `turn`'s BANKED score reached the target? */
export function isWin(scores, turn, target) {
  return scores[turn - 1] >= target;
}

/* ---- AI policy -------------------------------------------------------------- */

/**
 * The hold threshold for `turn`:
 *  - easy: a random 10–30 (mistakes on purpose)
 *  - medium: 20–24, drifting up when far behind, down when close to winning
 *  - hard: the known Pig optimum (~21) with a score-gap adjustment
 */
export function holdThreshold(state, turn, difficulty, rand = Math.random) {
  const me = state.scores[turn - 1];
  const them = state.scores[other(turn) - 1];
  const gap = them - me; // > 0 = I'm behind
  const target = state.target;

  if (difficulty === 'easy') {
    return 10 + Math.floor(rand() * 21); // 10–30
  }
  if (difficulty === 'medium') {
    // mild awareness: chase when behind, bank safely when ahead
    if (gap > 15) return 18;
    if (gap < -15) return 24;
    return 22;
  }
  // hard — the known optimum: ~21; hold earlier when a hold can win, push
  // (lower threshold) when far behind
  if (me + 21 >= target) return 21; // a hold now wins or nearly wins
  if (gap > 20) return 17; // gamble when behind
  if (gap < -20) return 25; // protect a lead
  return 21;
}

/** What the AI does on its turn: 'roll' | 'hold'. */
export function aiAction(state, turn, difficulty, rand = Math.random) {
  return state.pot >= holdThreshold(state, turn, difficulty, rand) ? 'hold' : 'roll';
}
