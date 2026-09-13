/**
 * ============================================================================
 * config.js — Flying Snake (flags + strings, host-overridable)
 * ============================================================================
 * Rev 2 pattern (plan/games/06-flying-snake.md §12): environment flags and
 * per-locale UI strings in one host-overridable place:
 *
 *   defaults  ←  window.__FLYING_SNAKE_CONFIG__ (host page / WebView)
 *             ←  ?locale=fr URL param (testing)
 *
 * Physics/tuning constants stay in core.js — the plan §2 tables are the spec
 * of record. `prefs` in storage.js may override copy at runtime but is a
 * per-device cache — the source of truth for strings lives here.
 * ============================================================================
 */

const DEFAULT_CONFIG = {
  locale: 'en',
  strings: {
    en: {
      // {score} / {url} are substituted by main.js at share time.
      share: 'Flew through {score} gaps in Flying Snake — beat that! {url}',
      // Medal names + emoji per tier (plan §2), keyed by medalFor's tier.
      medalNameBronze: 'Bronze',
      medalNameSilver: 'Silver',
      medalNameGold: 'Gold',
      medalNamePlatinum: 'Platinum',
      medalEmojiBronze: '🥉',
      medalEmojiSilver: '🥈',
      medalEmojiGold: '🥇',
      medalEmojiPlatinum: '🏆',
      // Gameover line for a run with no medal; {bronzeAt} is core.js's
      // MEDAL_THRESHOLDS.bronze.
      noMedal: 'Reach {bronzeAt} for a 🥉 medal',
      // Distance to the next tier above a medal already earned (suggestion 03).
      nextMedal: '{n} more for {medal}!',
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
    if (typeof window !== 'undefined' && window.__FLYING_SNAKE_CONFIG__) {
      return window.__FLYING_SNAKE_CONFIG__;
    }
  } catch {
    /* no window (tests) — fine */
  }
  return null;
}

function readUrlLocale() {
  try {
    if (typeof location === 'undefined') return null;
    const locale = new URLSearchParams(location.search).get('locale');
    return locale ? { locale } : null;
  } catch {
    return null;
  }
}

export const GAME_CONFIG = resolveConfig(DEFAULT_CONFIG, readHostOverride(), readUrlLocale());

/** Look up a string for the active locale, falling back to English, then the key. */
export function t(key, vars) {
  const strings = GAME_CONFIG.strings[GAME_CONFIG.locale] || GAME_CONFIG.strings.en || {};
  const template = strings[key] ?? GAME_CONFIG.strings.en?.[key] ?? key;
  if (!vars) return template;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
}
