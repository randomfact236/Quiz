/**
 * ============================================================================
 * config.js — Word Puzzle (flags + strings, host-overridable)
 * ============================================================================
 * Rev 2 pattern (plan/games/04-word-puzzle.md §12, reference
 * 03-sliding-puzzle.md Rev 2): environment flags and per-locale UI strings in
 * one host-overridable place:
 *
 *   defaults  ←  window.__WORD_PUZZLE_CONFIG__ (host page / WebView)
 *             ←  ?locale=fr URL param (testing)
 *
 * `prefs` in storage.js may override copy at runtime but is a per-device
 * cache — the source of truth for strings lives here.
 * ============================================================================
 */

const DEFAULT_CONFIG = {
  locale: 'en',
  strings: {
    en: {
      // {words} / {time} / {stars} / {url} are substituted by game.js at
      // share time.
      share: 'I found {words} words in {time} · {stars} in Word Puzzle — can you beat it? {url}',
      hint: 'Hint',
      alreadyFound: 'Already found ✓',
      // First hint of a level attempt warns about the perfect-run star.
      hintStarToast: 'Using a hint means no perfect-run star this level.',
      themeCompleteTitle: '{theme} complete!',
      themeCompleteSub: 'Theme stars: {stars}/9',
      themeCompletePerfect: ' — perfect! 🌟',
      themeCompleteNewBest: ' · New best time!',
      copiedToast: 'Result copied to clipboard 📋',
      copyPrompt: 'Copy your result:',
    },
  },
};

/** Shallow-merge `override` layers into a copy of `base` (strings per locale). */
export function resolveConfig(base, ...overrides) {
  const out = { ...base, strings: {} };
  for (const layer of [base, ...overrides]) {
    if (!layer || typeof layer !== 'object') continue;
    if (typeof layer.locale === 'string' && layer.locale) out.locale = layer.locale;
    if (layer.strings && typeof layer.strings === 'object') {
      for (const [locale, strings] of Object.entries(layer.strings)) {
        if (strings && typeof strings === 'object') {
          out.strings[locale] = { ...(out.strings[locale] || {}), ...strings };
        }
      }
    }
  }
  return out;
}

function readHostOverride() {
  try {
    if (typeof window !== 'undefined' && window.__WORD_PUZZLE_CONFIG__) {
      return window.__WORD_PUZZLE_CONFIG__;
    }
  } catch {
    /* no window (tests) — fine */
  }
  return null;
}

function readUrlOverrides() {
  try {
    if (typeof location === 'undefined') return null;
    const params = new URLSearchParams(location.search);
    const override = {};
    const locale = params.get('locale');
    if (locale) override.locale = locale;
    return Object.keys(override).length ? override : null;
  } catch {
    return null;
  }
}

export const GAME_CONFIG = resolveConfig(DEFAULT_CONFIG, readHostOverride(), readUrlOverrides());

/** Look up a string for the active locale, falling back to English, then the key. */
export function t(key, vars) {
  const strings = GAME_CONFIG.strings[GAME_CONFIG.locale] || GAME_CONFIG.strings.en || {};
  const template = strings[key] ?? GAME_CONFIG.strings.en?.[key] ?? key;
  if (!vars) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}
