/**
 * ============================================================================
 * core.js — Tap or Don't Tap (pure model, no DOM — the test surface)
 * ============================================================================
 * Extracted from game.js (Rev 2 architecture, plan/games/01-tap-or-dont-tap.md
 * §13). Everything here is deterministic given its inputs: `rng` is injectable
 * and `Date`/`performance` are never used. The UI shell (game.js) imports this
 * module; the jest suite (src/__tests__/games-tap-or-dont-tap.test.ts) tests
 * it directly.
 * ============================================================================
 */

export const SLUG = 'tap-or-dont-tap';
export const TOTAL_HEARTS = 3;
export const MIN_WAIT_MS = 300;
export const MAX_WAIT_MS = 3000;
export const WINDOW_START_MS = 1200;
export const WINDOW_SHRINK_MS = 25;
export const WINDOW_FLOOR_MS = 450;
export const RESIST_POINTS = 25;
export const DECOY_IGNORE_POINTS = 50;
export const GREEN_BASE_POINTS = 100;
export const GREEN_STREAK_BONUS = 10;
export const GREEN_MAX_POINTS = GREEN_BASE_POINTS * 5; // streak multiplier caps at ×5
export const DECOY_FROM_ROUND = 10;
export const STROOP_FROM_ROUND = 15;
export const SWAP_FROM_ROUND = 12;
export const SWAP_CHANCE = 0.15;
export const SWAP_ROUNDS = 3;
export const HISTORY_MAX = 20;

/** Signal window for a round: starts at 1200ms, shrinks 25ms/round, floor 450ms. */
export function windowMsForRound(round) {
  return Math.max(WINDOW_FLOOR_MS, WINDOW_START_MS - (round - 1) * WINDOW_SHRINK_MS);
}

/**
 * Green-hit points: base 100 + streak × 10, capped at ×5 the base (500).
 * `streak` counts consecutive successful rounds immediately before this hit.
 */
export function pointsForGreen(streak) {
  return Math.min(GREEN_BASE_POINTS + Math.max(0, streak) * GREEN_STREAK_BONUS, GREEN_MAX_POINTS);
}

/**
 * Generate a round's signal spec: `{ color, expectsTap, word }`.
 * - green  → tap · red → don't · decoys (yellow/blue) → never tap
 * - Stroop rounds show a word that contradicts the color — color wins.
 * - `plainOnly` (rule-flip rounds) restricts the pool to green/red so the
 *   swapped rule stays learnable; the swap itself is applied by resolveRound.
 * `rng` is injectable for tests; defaults to Math.random.
 */
export function generateRound(round, rng = Math.random, { plainOnly = false } = {}) {
  const roll = rng();
  const plain = () =>
    roll < 0.55
      ? { color: 'green', expectsTap: true, word: null }
      : { color: 'red', expectsTap: false, word: null };
  if (plainOnly || round < DECOY_FROM_ROUND) return plain();
  const decoy = () => ({ color: rng() < 0.5 ? 'yellow' : 'blue', expectsTap: false, word: null });
  if (round < STROOP_FROM_ROUND) {
    // 45% green · 35% red · 20% decoy
    if (roll < 0.45) return plain();
    if (roll < 0.8) return { color: 'red', expectsTap: false, word: null };
    return decoy();
  }
  // 40% green · 30% red · 15% decoy · 15% Stroop trap
  if (roll < 0.4) return plain();
  if (roll < 0.7) return { color: 'red', expectsTap: false, word: null };
  if (roll < 0.85) return decoy();
  // "TAP" written red (resist) or "WAIT" written green (tap) — color wins.
  return rng() < 0.5
    ? { color: 'red', expectsTap: false, word: 'TAP' }
    : { color: 'green', expectsTap: true, word: 'WAIT' };
}

/** The swap inverts green/red meaning; decoys keep "never tap". */
export function effectiveExpectsTap(spec, rulesSwapped) {
  if (!rulesSwapped) return spec.expectsTap;
  return spec.color === 'green' || spec.color === 'red' ? !spec.expectsTap : spec.expectsTap;
}

/**
 * Resolve one signal outcome. `tapped=false, elapsedMs=null` means the window
 * expired untouched. Points for hits need the engine's current streak.
 *
 * @param {{ color: string, expectsTap: boolean, word: string | null }} spec
 * @param {{ rulesSwapped?: boolean, tapped: boolean, elapsedMs?: number | null, streak?: number }} [options]
 */
export function resolveRound(
  spec,
  { rulesSwapped = false, tapped, elapsedMs = null, streak = 0 } = {}
) {
  const expectsTap = effectiveExpectsTap(spec, rulesSwapped);
  if (tapped && expectsTap) {
    return {
      outcome: 'hit',
      points: pointsForGreen(streak),
      heartsLost: 0,
      reactionMs: Math.max(1, Math.round(elapsedMs ?? 0)),
    };
  }
  if (tapped && !expectsTap) {
    const outcome = spec.color === 'green' || spec.color === 'red' ? 'tap-red' : 'tap-decoy';
    return { outcome, points: 0, heartsLost: 1, reactionMs: null };
  }
  if (!tapped && expectsTap) {
    return { outcome: 'miss', points: 0, heartsLost: 1, reactionMs: null };
  }
  // Untouched non-tap signal: red resist (+25) or decoy ignored (+50).
  const isDecoy = spec.color !== 'green' && spec.color !== 'red';
  return {
    outcome: isDecoy ? 'decoy-ignored' : 'resist',
    points: isDecoy ? DECOY_IGNORE_POINTS : RESIST_POINTS,
    heartsLost: 0,
    reactionMs: null,
  };
}

/**
 * Feedback-copy key for a losing outcome (suggestion 01 item 3): maps the
 * resolver's outcome to a distinct config string. On a Stroop round (a lying
 * word was on screen) every misjudge gets the one explanatory message —
 * "the word lies, the color is truth" — regardless of which way it failed.
 * Copy-only: no new logic, the outcome value already carries the cause.
 */
export function loseFeedbackKey(outcome, { stroop = false } = {}) {
  if (stroop) return 'stroopTrap';
  return { miss: 'missedIt', 'tap-red': 'wasRed', 'tap-decoy': 'wasDecoy' }[outcome] ?? 'missedIt';
}

/**
 * Local top-% for the end screen: with a real history (≥5 runs), the top-%
 * implied by the share of past runs the current score beats (beating 60% of
 * your runs ⇒ top 40%); otherwise a baked-in score→top-% curve.
 */
export function localPercentile(score, pastScores) {
  if (Array.isArray(pastScores) && pastScores.length >= 5) {
    const beaten = pastScores.filter((s) => s < score).length;
    const beatenPct = Math.round((beaten / pastScores.length) * 100);
    return Math.min(99, Math.max(1, 100 - beatenPct));
  }
  return bakedPercentile(score);
}

const BAKED_TABLE = [
  [4000, 3],
  [2000, 8],
  [1000, 12],
  [600, 20],
  [300, 30],
  [100, 40],
];

export function bakedPercentile(score) {
  for (const [min, topPct] of BAKED_TABLE) {
    if (score >= min) return topPct;
  }
  return 50;
}

/** Polyline points for the menu sparkline (history scores, oldest → newest). */
export function sparklinePoints(values, width = 200, height = 40) {
  if (!values || values.length < 2) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / span) * (height - 4) - 2;
      return `${Math.round(x)},${Math.round(y)}`;
    })
    .join(' ');
}
