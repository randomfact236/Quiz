/**
 * ============================================================================
 * Spirit Runner — gates.js (Game 07, plan/games/07-spirit-runner.md §6)
 * ============================================================================
 * The pure rune-gate module: the 5 learnable rules that decide which side of
 * a path split is correct (plan §2 Phase C). Zero DOM access — this is a test
 * surface imported by the jest suite (src/__tests__/games-spirit-runner.test.ts)
 * and the folder's core.test.html harness, as well as by main.js.
 *
 * API (plan §2 Phase C, verbatim):
 *   makeGate(ruleId, rng, runState) → { correctSide, hintText, runes, … }
 *   resolveChoice(gate, side)       → 'correct' | 'shadow'
 *   hintFor(ruleId)                 → the rule's poetic banner line
 *
 * Determinism contract (plan §8): given the same ruleId, rng stream and
 * runState, makeGate returns the exact same gate — correctSide included.
 * makeGate ALSO advances runState (lastGateRune / lastOrbColor) so the next
 * gate of an echo/color rule chains off this one; that mutation is part of
 * the pure, testable contract.
 *
 * The 5 rules (plan §2 Phase C table):
 *   parity    — side matching orbsSinceGate % 2 (even → left)
 *   echo      — the gate whose rune equals the previous gate's rune
 *   negation  — NOT the gate matching the banner's shape hint
 *   sequence  — the gate continuing the shown 3-symbol pattern
 *   color     — the side matching the last orb's color
 * ============================================================================
 */

/** Rune glyphs painted on the doors (shape-echo / negation signals). */
export const RUNE_ALPHABET = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᛃ', 'ᛞ'];

/** Pattern glyphs for the sequence rule (hint renders as "▲ ▲ ▲ …"). */
export const GLYPHS = ['▲', '●', '■', '◆'];

/** Spirit orb colors (core.js spawns these; the color rule reads the last). */
export const ORB_COLORS = ['cyan', 'violet', 'gold'];

/** Rule ids in their authored cycle order (a run shuffles this — plan §2). */
export const RULE_IDS = ['parity', 'echo', 'negation', 'sequence', 'color'];

/** Fresh runState fields the gate chain needs (main.js spreads this at run
 *  start; echo/color always have an answer because these are seeded). */
export function createGateState() {
  return {
    lastGateRune: RUNE_ALPHABET[0],
    lastOrbColor: null, // the color rule seeds it on first use
  };
}

/** Fisher–Yates shuffle of the authored rule order, driven by `rng` — the
 *  per-run seed makes the cycle learnable within a run, fresh across runs. */
export function shuffledRules(rng) {
  const order = RULE_IDS.slice();
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = order[i];
    order[i] = order[j];
    order[j] = tmp;
  }
  return order;
}

/**
 * The rule's poetic banner line (plan §10 decision #10: poetic line +
 * learnable literal rule). Never empty for any rule — asserted by tests.
 */
export function hintFor(ruleId) {
  switch (ruleId) {
    case 'parity':
      return 'Even spirits walk the left path.';
    case 'echo':
      return 'Follow the doubled symbol.';
    case 'negation':
      return 'The moon door lies.';
    case 'sequence':
      return 'Follow the pattern.';
    case 'color':
      return 'Trust the last light you caught.';
    default:
      return '';
  }
}

function runePair(rng) {
  const a = Math.floor(rng() * RUNE_ALPHABET.length);
  let b = Math.floor(rng() * (RUNE_ALPHABET.length - 1));
  if (b >= a) b++;
  return [RUNE_ALPHABET[a], RUNE_ALPHABET[b]];
}

/**
 * Build one gate. Mutates runState (lastGateRune / lastOrbColor) so the NEXT
 * echo/color gate chains off this one — the correct door's rune becomes the
 * "previous gate's rune", and a first-ever color gate seeds the trail with
 * the color it displays (documented learnability, plan §9 balance pass).
 *
 * Returns:
 *   { rule, correctSide, hintText, runes: {left, right},
 *     bannerRune?, pattern?: [g,g,g], colors?: {left, right} }
 * `correctSide` is the full answer; resolveChoice() compares against it.
 */
export function makeGate(ruleId, rng, runState) {
  let gate;

  if (ruleId === 'parity') {
    // plan table: side matching orbsSinceGate % 2 — even → left, odd → right
    const even = runState.orbsSinceGate % 2 === 0;
    const side = even ? 'left' : 'right';
    const [r1, r2] = runePair(rng);
    gate = {
      rule: 'parity',
      correctSide: side,
      hintText: hintFor('parity'),
      runes: { left: r1, right: r2 },
      pattern: null,
      colors: null,
    };
  } else {
    const correctIsLeft = rng() < 0.5;
    const correctSide = correctIsLeft ? 'left' : 'right';

    if (ruleId === 'echo') {
      // the gate whose rune == the previous gate's rune (seeded on fresh runs)
      const doubled = runState.lastGateRune || RUNE_ALPHABET[0];
      const [x, y] = runePair(rng);
      const other = x === doubled ? y : x;
      gate = {
        rule: 'echo',
        correctSide,
        hintText: hintFor('echo'),
        runes: {
          left: correctSide === 'left' ? doubled : other,
          right: correctSide === 'left' ? other : doubled,
        },
        bannerRune: doubled,
        pattern: null,
        colors: null,
      };
    } else if (ruleId === 'negation') {
      // NOT the gate matching the banner's shape hint: the banner shows the
      // LIAR rune; the door that does NOT wear it is correct
      const [liar, truth] = runePair(rng);
      const liarSide = correctSide === 'left' ? 'right' : 'left';
      gate = {
        rule: 'negation',
        correctSide,
        hintText: hintFor('negation') + ' Shun ' + liar + '.',
        runes: {
          left: liarSide === 'left' ? liar : truth,
          right: liarSide === 'left' ? truth : liar,
        },
        bannerRune: liar,
        pattern: null,
        colors: null,
      };
    } else if (ruleId === 'sequence') {
      // 3-symbol pattern whose 4th symbol is unambiguous: ▲▲▲→▲ · ▲●▲→● · ●▲●→▲
      const a = Math.floor(rng() * GLYPHS.length);
      let b = Math.floor(rng() * (GLYPHS.length - 1));
      if (b >= a) b++;
      const kind = Math.floor(rng() * 3); // 0: AAA · 1: ABA · 2: BAB
      const pattern =
        kind === 0
          ? [GLYPHS[a], GLYPHS[a], GLYPHS[a]]
          : kind === 1
            ? [GLYPHS[a], GLYPHS[b], GLYPHS[a]]
            : [GLYPHS[b], GLYPHS[a], GLYPHS[b]];
      const next = kind === 0 ? pattern[0] : pattern[1];
      const decoy = next === GLYPHS[a] ? GLYPHS[b] : GLYPHS[a];
      const [r1, r2] = runePair(rng);
      gate = {
        rule: 'sequence',
        correctSide,
        hintText: pattern.join(' ') + ' …',
        runes: { left: r1, right: r2 },
        shapes: {
          left: correctSide === 'left' ? next : decoy,
          right: correctSide === 'left' ? decoy : next,
        },
        pattern,
        colors: null,
      };
    } else if (ruleId === 'color') {
      // side matching the last orb's color; a trail with no light yet seeds one
      if (!runState.lastOrbColor) {
        runState.lastOrbColor = ORB_COLORS[Math.floor(rng() * ORB_COLORS.length)];
      }
      const target = runState.lastOrbColor;
      const others = ORB_COLORS.filter((c) => c !== target);
      const decoy = others[Math.floor(rng() * others.length)];
      const [r1, r2] = runePair(rng);
      gate = {
        rule: 'color',
        correctSide,
        hintText: hintFor('color'),
        runes: { left: r1, right: r2 },
        colors: {
          left: correctSide === 'left' ? target : decoy,
          right: correctSide === 'left' ? decoy : target,
        },
        pattern: null,
      };
    } else {
      // unreachable with the authored RULE_IDS — defensive fallback keeps the
      // contract (non-empty hint + a decidable side) even for a typo'd id
      const [r1, r2] = runePair(rng);
      gate = {
        rule: String(ruleId),
        correctSide,
        hintText: hintFor('parity'),
        runes: { left: r1, right: r2 },
        pattern: null,
        colors: null,
      };
    }
  }

  // the chain advances: the correct door's rune becomes the NEXT echo's
  // "previous gate's rune" (part of the documented mutation contract)
  runState.lastGateRune = gate.runes[gate.correctSide];
  return gate;
}

/** 'correct' → +100 and the forest continues; 'shadow' → the realm takes you. */
export function resolveChoice(gate, side) {
  return side === gate.correctSide ? 'correct' : 'shadow';
}
