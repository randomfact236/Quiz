/**
 * ============================================================================
 * saved-items.ts — device-local bookmarks (Save option feedback)
 * ============================================================================
 * Backs the 🔖 Save action (card chips + ShareMenu). Saved ids live in
 * localStorage grouped by namespace ('jokes', 'image-riddles'); every toggle
 * broadcasts an event so mounted hooks (card chips) stay in sync with
 * saves made elsewhere (e.g. inside the share menu).
 * ============================================================================
 */

export const SAVED_ITEMS_KEY = 'aiquiz:saved-items';
export const SAVED_ITEMS_EVENT = 'aiquiz:saved-changed';

type SavedMap = Record<string, string[]>;

function readAll(): SavedMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_ITEMS_KEY) ?? '{}') as SavedMap;
  } catch {
    return {};
  }
}

function writeAll(map: SavedMap): void {
  try {
    window.localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(map));
  } catch {
    /* storage unavailable (private mode) — keep in-memory behavior only */
  }
}

export function getSavedIds(namespace: string): string[] {
  return readAll()[namespace] ?? [];
}

export function isSaved(namespace: string, id: string): boolean {
  return getSavedIds(namespace).includes(id);
}

/** Toggle one item; returns the new saved state. Broadcasts a sync event. */
export function toggleSaved(namespace: string, id: string): boolean {
  const map = readAll();
  const list = new Set(map[namespace] ?? []);
  const nowSaved = !list.has(id);
  if (nowSaved) {
    list.add(id);
  } else {
    list.delete(id);
  }
  map[namespace] = [...list];
  writeAll(map);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SAVED_ITEMS_EVENT, { detail: { namespace } }));
  }
  return nowSaved;
}
