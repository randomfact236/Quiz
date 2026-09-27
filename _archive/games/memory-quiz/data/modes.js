/**
 * ============================================================================
 * Memory Quiz — data/modes.js (upgrade architecture §4.3)
 * ============================================================================
 * Modes are data: each changes the level source, hearts, scoring rules and a
 * couple of presentation flags — never the engine. The seeded daily board is
 * not a menu mode; it keeps its dedicated button (it is date-seeded and
 * records per day rather than per run).
 *
 *   levelSource  'campaign' → one board per level, level picker drives entry
 *                'ladder'   → boards climb the ladder from level 1 (curated
 *                             rows first, then the endless generator)
 *   hearts       hearts for the run (`Infinity` = no fail state)
 *   rules        merged into every level's rules for the run (e.g.
 *                namesUnderItems, memorizeBonusS, questionS override,
 *                timeBonusPerSecond)
 * ============================================================================
 */

export const MODES = {
  campaign: {
    id: 'campaign',
    label: 'Campaign',
    levelSource: 'campaign',
    hearts: 3,
    menu: 'levels',
  },
  daily: { id: 'daily', label: 'Daily', levelSource: 'ladder', hearts: 3 },
  endless: { id: 'endless', label: 'Endless', levelSource: 'ladder', hearts: 3 },
  zen: { id: 'zen', label: 'Zen', levelSource: 'ladder', hearts: Infinity },
  hard: { id: 'hard', label: 'Hard', levelSource: 'ladder', hearts: 1 },
  kids: {
    id: 'kids',
    label: 'Kids',
    levelSource: 'ladder',
    hearts: 5,
    rules: { namesUnderItems: true, memorizeBonusS: 2 },
  },
  timeAttack: {
    id: 'timeAttack',
    label: 'Time attack',
    levelSource: 'ladder',
    hearts: 3,
    rules: { questionS: 5, timeBonusPerSecond: 5 },
  },
  // Mystery Mix host mode (suggestion 08 task 2) — never a menu chip: a card
  // plays ONE level (campaign source → level-clear + stars to levels[id])
  // with the card's own mode carrying hearts + rule twists.
  shuffle: { id: 'shuffle', label: 'Mystery Mix', levelSource: 'campaign', hearts: 3 },
};

/** Menu chip order — the seeded daily keeps its dedicated button instead. */
export const MODE_ORDER = ['campaign', 'endless', 'zen', 'hard', 'kids', 'timeAttack'];

/** Mode by id with a safe fallback (an unknown pref must not crash). */
export function modeById(id) {
  return MODES[id] || MODES.campaign;
}

/**
 * Effective rules for a run: mode rules merged over the level's own (mode
 * wins — a mode may tighten a level, e.g. time attack's 5 s window).
 */
export function rulesFor(mode, level) {
  return { ...(level.rules || {}), ...(mode.rules || {}) };
}
