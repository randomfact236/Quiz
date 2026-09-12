/**
 * ============================================================================
 * config.js — Spirit Runner (flags + strings, host-overridable)
 * ============================================================================
 * Rev 2 pattern (plan/games/07-spirit-runner.md §12): environment flags,
 * per-locale UI strings, and the account-sync seam in one host-overridable
 * place:
 *
 *   defaults  ←  window.__SPIRIT_RUNNER_CONFIG__ (host page / WebView)
 *             ←  ?locale=fr URL param (testing)
 *
 * Hosts that want account-level continuity inject `remoteAdapter`:
 *   window.__SPIRIT_RUNNER_CONFIG__ = { remoteAdapter: { save(saveObj) } }
 * The game never checks auth — local-first always, the adapter mirrors
 * best-effort, and without an adapter nothing ever touches the network.
 *
 * Tuning constants (power durations, densities, shard formula) live in
 * core.js — the plan §2 tables are the spec of record.
 * ============================================================================
 */

const DEFAULT_CONFIG = {
  locale: 'en',
  remoteAdapter: null,
  strings: {
    en: {
      // {distance} / {character} / {score} / {url} are substituted by main.js
      // at share time.
      share: 'Ran {distance} m as {character} in Spirit Runner — {score} pts — beat that! {url}',
    },
  },
};

/** Shallow-merge `override` layers into a copy of `base` (strings per locale). */
export function resolveConfig(base, ...overrides) {
  const out = { ...base, strings: {}, remoteAdapter: null };
  for (const layer of [base, ...overrides]) {
    if (!layer || typeof layer !== 'object') continue;
    if (typeof layer.locale === 'string' && layer.locale) out.locale = layer.locale;
    if (layer.remoteAdapter && typeof layer.remoteAdapter.save === 'function') {
      out.remoteAdapter = layer.remoteAdapter;
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
    if (typeof window !== 'undefined' && window.__SPIRIT_RUNNER_CONFIG__) {
      return window.__SPIRIT_RUNNER_CONFIG__;
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
