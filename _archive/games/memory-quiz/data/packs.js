/**
 * ============================================================================
 * Memory Quiz — data/packs.js (Game 08, plan/games/08-memory-quiz.md §2)
 * ============================================================================
 * Content packs as emoji glyphs — zero assets, zero network (browser-floor
 * rule: JS module, never a JSON import). `name` is per-locale: question text
 * and aria-labels read itemName(item, locale) from core.js.
 *
 * 14 items per pack: the level ladder's worst spare demand (10 placed items +
 * 2 missing-question distractors + 1 odd-one answer, or 11 + 2) needs 14 —
 * lintPacks(packs, LEVELS, QUESTION_TYPES) enforces it against data/levels.js.
 * ============================================================================
 */

export const PACKS = [
  {
    id: 'snacks',
    title: 'Snacks',
    items: [
      { emoji: '🍕', name: { en: 'pizza' } },
      { emoji: '🌭', name: { en: 'hotdog' } },
      { emoji: '🍟', name: { en: 'fries' } },
      { emoji: '🥪', name: { en: 'sandwich' } },
      { emoji: '🍗', name: { en: 'chicken leg' } },
      { emoji: '🍔', name: { en: 'burger' } },
      { emoji: '🌮', name: { en: 'taco' } },
      { emoji: '🍩', name: { en: 'donut' } },
      { emoji: '🥨', name: { en: 'pretzel' } },
      { emoji: '🍿', name: { en: 'popcorn' } },
      { emoji: '🍪', name: { en: 'cookie' } },
      { emoji: '🧁', name: { en: 'cupcake' } },
      { emoji: '🥞', name: { en: 'pancake' } },
      { emoji: '🍫', name: { en: 'chocolate' } },
    ],
  },
  {
    id: 'fruits',
    title: 'Fruits',
    items: [
      { emoji: '🍎', name: { en: 'apple' } },
      { emoji: '🍌', name: { en: 'banana' } },
      { emoji: '🍇', name: { en: 'grapes' } },
      { emoji: '🍓', name: { en: 'strawberry' } },
      { emoji: '🍉', name: { en: 'watermelon' } },
      { emoji: '🍍', name: { en: 'pineapple' } },
      { emoji: '🍒', name: { en: 'cherry' } },
      { emoji: '🍑', name: { en: 'peach' } },
      { emoji: '🥝', name: { en: 'kiwi' } },
      { emoji: '🍋', name: { en: 'lemon' } },
      { emoji: '🥭', name: { en: 'mango' } },
      { emoji: '🥥', name: { en: 'coconut' } },
      { emoji: '🍐', name: { en: 'pear' } },
      { emoji: '🍈', name: { en: 'melon' } },
    ],
  },
];

export const DEFAULT_PACK_ID = 'snacks';

/** Pack by id, falling back to the default (an unknown pref must not crash). */
export function packById(id) {
  return PACKS.find((pack) => pack.id === id) || PACKS.find((pack) => pack.id === DEFAULT_PACK_ID);
}
