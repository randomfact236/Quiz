/**
 * ============================================================================
 * Memory Quiz — config.js (Game 08, flags + strings, host-overridable)
 * ============================================================================
 * Rev 2 pattern (plan/games/08-memory-quiz.md §6): flags + per-locale UI
 * strings in one host-overridable place:
 *
 *   defaults  ←  window.__MEMORY_QUIZ_CONFIG__ (host page / WebView)
 *             ←  ?locale=xx URL param (testing)
 *
 * `prefs` in storage.js may cache choices at runtime but the source of truth
 * for strings lives here. The social-video CTAs ("leave your answer in the
 * comments / follow") map to the share flow — the copy stays configurable so
 * an app/social wrapper can append its own CTA (plan §11).
 * ============================================================================
 */

const DEFAULT_CONFIG = {
  locale: 'en',
  flags: {
    /** Daily board (seed = YYYYMMDD) — gated per plan §3/§12. */
    dailyEnabled: true,
    /** Host/testing override: open every campaign level regardless of stars. */
    unlockAll: false,
  },
  /** Host-granted levels (`{ l07: true }`) — on top of star-derived unlocks. */
  grants: {},
  strings: {
    en: {
      // {seconds} / {item} / {points} / {score} / {boards} / {streak} / {url}
      // / {level} / {stars} are substituted by game.js.
      memorizeBanner: 'You have {seconds} seconds to memorize!',
      whereIs: 'Where is the {item}?',
      whichMissing: 'Which snack is missing?',
      movedWhere: 'The {item} moved! Where is it now?',
      oddOne: 'Which snack was NOT on the board?',
      feedbackHit: '+{points}',
      feedbackMissWhere: 'It was there!',
      feedbackMissMissing: 'It was the {item}!',
      feedbackMissOddOne: 'It was the {item}!',
      feedbackMissSwap: 'It moved there!',
      feedbackTimeout: "Time's up!",
      levelCleared: 'Level {n} cleared!',
      perfectBoard: 'Perfect — no heart lost!',
      share:
        'I scored {score} in Memory Quiz ({boards} boards, best streak {streak}) — can you beat it? {url}',
      shareLevel:
        'I cleared Memory Quiz {level} with {stars} and {score} points — can you beat it? {url}',
      shareDaily: 'I scored {score} in today\u2019s Daily Memory Quiz — can you beat me? {url}',
    },
  },
};

/** Shallow-merge override layers into a copy of base (flags, grants, strings). */
export function resolveConfig(base, ...overrides) {
  const out = {
    ...base,
    flags: { ...(base.flags || {}) },
    grants: { ...(base.grants || {}) },
    strings: {},
  };
  for (const layer of [base, ...overrides]) {
    if (!layer || typeof layer !== 'object') continue;
    if (typeof layer.locale === 'string' && layer.locale) out.locale = layer.locale;
    if (layer.flags && typeof layer.flags === 'object') {
      for (const [flag, value] of Object.entries(layer.flags)) {
        if (typeof value === 'boolean') out.flags[flag] = value;
      }
    }
    if (layer.grants && typeof layer.grants === 'object') {
      for (const [levelId, value] of Object.entries(layer.grants)) {
        if (value === true) out.grants[levelId] = true;
      }
    }
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
    if (typeof window !== 'undefined' && window.__MEMORY_QUIZ_CONFIG__) {
      return window.__MEMORY_QUIZ_CONFIG__;
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
    // testing/host seam: ?unlockAll=1 opens every campaign level
    if (params.get('unlockAll') === '1') override.flags = { unlockAll: true };
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
