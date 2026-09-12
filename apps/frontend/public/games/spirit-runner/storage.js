/**
 * ============================================================================
 * storage.js — Spirit Runner (guarded persistence facade)
 * ============================================================================
 * Rev 2 pattern (plan/games/07-spirit-runner.md §12): one versioned save
 * document — shards, unlocks, character, settings — normalized on every read,
 * with a remote adapter slot a host can inject for future account sync.
 *
 * Local-first contract: every call is try/catch guarded, works in private
 * mode (persistence silently skipped), and NEVER touches the network unless a
 * host has explicitly injected a remote adapter. The game never checks auth —
 * the host decides, and guests keep full local persistence.
 *
 * Versioned layout:
 *   game:spirit-runner:save → { version: 1, bestDistanceM, shards, unlocked,
 *                               character, settings }
 * ============================================================================
 */

import { SAVE_KEY } from './core.js';

const SAVE_VERSION = 1;

/** Character ids the save schema accepts (main.js's CHARACTERS keys). */
const CHARACTER_IDS = ['spirit', 'hunter', 'monk'];

let remoteAdapter = null;

/** Storage that degrades to an in-memory object when localStorage is unavailable. */
const storage = (() => {
  const fallback = {};
  function backend() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const probe = '__sr_probe__';
        window.localStorage.setItem(probe, '1');
        window.localStorage.removeItem(probe);
        return window.localStorage;
      }
    } catch {
      /* private mode / disabled — fall through */
    }
    return null;
  }
  return {
    readJson(key, fallbackValue) {
      try {
        const store = backend();
        const raw = store ? store.getItem(key) : fallback[key] || null;
        if (!raw) return fallbackValue;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : fallbackValue;
      } catch {
        return fallbackValue;
      }
    },
    writeJson(key, value) {
      try {
        const store = backend();
        if (store) store.setItem(key, JSON.stringify(value));
        else fallback[key] = JSON.stringify(value);
      } catch {
        /* quota / private mode — the game keeps working without records */
      }
    },
  };
})();

function defaultSave() {
  return {
    version: SAVE_VERSION,
    bestDistanceM: 0,
    shards: 0,
    unlocked: ['spirit'],
    character: 'spirit',
    settings: { autoPower: false, muted: false },
  };
}

export function loadSave() {
  const raw = storage.readJson(SAVE_KEY, null);
  const def = defaultSave();
  if (!raw) return def;
  return {
    version: SAVE_VERSION,
    bestDistanceM:
      typeof raw.bestDistanceM === 'number' && raw.bestDistanceM >= 0 ? raw.bestDistanceM : 0,
    shards: typeof raw.shards === 'number' && raw.shards >= 0 ? Math.floor(raw.shards) : 0,
    unlocked:
      Array.isArray(raw.unlocked) && raw.unlocked.includes('spirit')
        ? raw.unlocked.filter((c) => CHARACTER_IDS.includes(c))
        : def.unlocked,
    character: CHARACTER_IDS.includes(raw.character) ? raw.character : 'spirit',
    settings: {
      autoPower: !!(raw.settings && raw.settings.autoPower),
      muted: !!(raw.settings && raw.settings.muted),
    },
  };
}

/** Host-injected account-sync seam (Rev 2): adapter shape `{ save(saveObj) }`. */
export function setRemoteAdapter(adapter) {
  remoteAdapter = adapter && typeof adapter.save === 'function' ? adapter : null;
}

export function saveSave(save) {
  const written = storage.writeJson(SAVE_KEY, save);
  if (remoteAdapter) {
    try {
      remoteAdapter.save(save); // host contract — never let it break gameplay
    } catch {
      /* best-effort mirror */
    }
  }
  return written;
}
