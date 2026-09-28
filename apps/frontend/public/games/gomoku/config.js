/**
 * ============================================================================
 * config.js — Gomoku (flags + strings, host-overridable)
 * ============================================================================
 * The games convention: environment flags and per-locale UI strings in one
 * host-overridable place:
 *
 *   defaults  ←  window.__GOMOKU_CONFIG__ (host page / WebView)
 *             ←  ?locale=fr URL param (testing)
 * ============================================================================
 */

const DEFAULT_CONFIG = {
  locale: 'en',
  /** Artificial pause so the computer's move feels deliberate (ttt pattern). */
  aiThinkDelayMs: 500,
  /** Hard-AI search depth (plan §4) — 4 plies plays very hard, still instant. */
  hardSearchDepth: 4,
  strings: {
    en: {
      // {score} is the series line; {url} the game URL.
      shareSolo:
        'Gomoku vs the computer ({difficulty}, {size}×{size}) — {score}. Can you do better? {url}',
      shareDuel: 'We played a Gomoku match — {score}. Settle it: {url}',
    },
  },
};

/** Shallow-merge `override` layers into a copy of `base` (strings per locale). */
export function resolveConfig(base, ...overrides) {
  const out = { ...base, strings: {} };
  for (const layer of [base, ...overrides]) {
    if (!layer || typeof layer !== 'object') continue;
    if (typeof layer.locale === 'string' && layer.locale) out.locale = layer.locale;
    if (Number.isFinite(layer.aiThinkDelayMs) && layer.aiThinkDelayMs >= 0) {
      out.aiThinkDelayMs = layer.aiThinkDelayMs;
    }
    if (Number.isFinite(layer.hardSearchDepth) && layer.hardSearchDepth >= 1) {
      out.hardSearchDepth = Math.min(layer.hardSearchDepth, 8);
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
    if (typeof window !== 'undefined' && window.__GOMOKU_CONFIG__) {
      return window.__GOMOKU_CONFIG__;
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
