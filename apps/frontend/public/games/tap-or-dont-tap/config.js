/**
 * ============================================================================
 * config.js — Tap or Don't Tap (flags + strings, host-overridable)
 * ============================================================================
 * Rev 2 pattern (plan/games/01-tap-or-dont-tap.md §13, reference
 * 03-sliding-puzzle.md): one place for environment flags and per-locale UI
 * strings, with a runtime override chain so the website build and the app
 * wrapper can differ without touching game code or rebuilding:
 *
 *   defaults  ←  window.__TAP_OR_DONT_TAP_CONFIG__ (host page / WebView)
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
      // Menu rule line — keeps its <b> markup; game.js injects it as HTML.
      menuRule:
        'Tap the <b class="green">green</b>. Resist the <b class="red">red</b>. That\'s it — until your brain betrays you.',
      swapBanner: '🔄 RULES SWAPPED! red = tap · green = wait',
      // Feedback overlay labels.
      tooEarly: '❌ Too early!',
      hitMs: '{ms}ms! {emoji}',
      resisted: '✅ Resisted +{points}',
      ignored: '✅ Ignored +{points}',
      tooSlow: '❌ Too slow',
      stroopLie: '❌ It said WAIT for a reason!',
      wasRed: '❌ It was RED!',
      // Gameover card copy.
      goTitle: '🚦 GAME OVER',
      bestReaction: 'Best reaction',
      topBadge: 'Top {pct}% of players',
      newRecord: '🏆 New personal best!',
      shareScoreBtn: '📤 Share my score',
      retryBtn: '↻ Retry',
      backToMenu: 'Back to menu',
      copiedNote: 'Copied to clipboard!',
      // {bestMs} / {score} / {url} are substituted by game.js at share time.
      share: "⚡ Best reaction: {bestMs} — score {score} in Tap or Don't Tap. Beat that! {url}",
    },
  },
};

/** Shallow-merge `override` into a copy of `base` (strings objects merged per key). */
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
    if (typeof window !== 'undefined' && window.__TAP_OR_DONT_TAP_CONFIG__) {
      return window.__TAP_OR_DONT_TAP_CONFIG__;
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
