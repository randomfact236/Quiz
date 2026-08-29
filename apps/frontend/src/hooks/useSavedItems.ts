/**
 * ============================================================================
 * useSavedItems — React binding for device-local bookmarks
 * ============================================================================
 * Keeps a namespace's saved-id map in state and re-reads whenever anything
 * toggles a save anywhere on the page (card chips, share menu) via the
 * 'aiquiz:saved-changed' event from lib/saved-items.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { getSavedIds, SAVED_ITEMS_EVENT, toggleSaved } from '@/lib/saved-items';

export function useSavedItems(namespace: string) {
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>({});

  const refresh = useCallback(() => {
    const map: Record<string, boolean> = {};
    for (const id of getSavedIds(namespace)) {
      map[id] = true;
    }
    setSavedMap(map);
  }, [namespace]);

  useEffect(() => {
    refresh();
    const onChanged = (e: Event) => {
      const detail = (e as CustomEvent<{ namespace: string }>).detail;
      if (!detail || detail.namespace === namespace) refresh();
    };
    window.addEventListener(SAVED_ITEMS_EVENT, onChanged);
    return () => window.removeEventListener(SAVED_ITEMS_EVENT, onChanged);
  }, [refresh]);

  const toggle = useCallback((id: string): boolean => toggleSaved(namespace, id), [namespace]);

  return { savedMap, toggle, refresh };
}
