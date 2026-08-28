/**
 * ============================================================================
 * useImageRiddleCatalog — server-filtered grid data with offline fallback
 * ============================================================================
 * A1: filtering happens server-side via GET /image-riddles/search (category +
 * difficulty + search + pagination), removing the old 200-row client-side
 * cap. When the API is unreachable the hook degrades to the bundled sample
 * dataset with client-side filtering and surfaces an amber banner.
 * ============================================================================
 */

'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  getImageRiddleCategories,
  getImageRiddlesStats,
  searchImageRiddles,
  type ImageRiddle,
  type ImageRiddleCategory,
} from '@/lib/image-riddles-api';
import { initialImageRiddles, initialImageRiddleCategories } from '@/lib/initial-data';

import { ITEMS_PER_PAGE, applyMixSort, filterRiddles } from '../lib/game';

import type { ImageRiddleSortOrder } from './useImageRiddleFilters';

const OFFLINE_RIDDLES = initialImageRiddles as ImageRiddle[];
const OFFLINE_CATEGORIES = initialImageRiddleCategories as ImageRiddleCategory[];

export interface UseImageRiddleCatalogArgs {
  search: string;
  activeCategory: string | null;
  difficulty: string;
  page: number;
  sortOrder: ImageRiddleSortOrder;
  shuffleSeed: number;
}

export function useImageRiddleCatalog({
  search,
  activeCategory,
  difficulty,
  page,
  sortOrder,
  shuffleSeed,
}: UseImageRiddleCatalogArgs) {
  const [categories, setCategories] = useState<ImageRiddleCategory[]>(OFFLINE_CATEGORIES);
  const [riddles, setRiddles] = useState<ImageRiddle[]>([]);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPublished, setTotalPublished] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  const categoryId = useMemo(
    () => categories.find((c) => c.name === activeCategory)?.id,
    [categories, activeCategory]
  );

  // Categories (bundled fallback stays until the API answers).
  useEffect(() => {
    let cancelled = false;
    getImageRiddleCategories()
      .then((list) => {
        if (!cancelled && list.length > 0) setCategories(list);
      })
      .catch(() => {
        /* offline: keep fallback categories */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Published total for the honest score denominator (#19: from the
  // /stats/overview endpoint instead of a probe search call).
  useEffect(() => {
    let cancelled = false;
    getImageRiddlesStats()
      .then((stats) => {
        if (!cancelled) setTotalPublished(stats.totalRiddles);
      })
      .catch(() => {
        if (!cancelled) {
          setTotalPublished(OFFLINE_RIDDLES.filter((r) => r.status === 'published').length);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Paged, server-filtered grid data.
  useEffect(() => {
    let cancelled = false;

    const loadOffline = () => {
      const filtered = filterRiddles(OFFLINE_RIDDLES, {
        activeCategory,
        difficulty,
        searchQuery: search,
      });
      const sorted = sortOrder === 'random' ? applyMixSort(filtered, shuffleSeed) : filtered;
      const start = (page - 1) * ITEMS_PER_PAGE;
      setRiddles(sorted.slice(start, start + ITEMS_PER_PAGE));
      setTotalFiltered(filtered.length);
      setLoadError('Could not load riddles — showing offline samples.');
    };

    const load = async () => {
      setIsLoading(true);
      try {
        // Deep-linked category names not present in the loaded categories
        // match nothing server-side; short-circuit to an empty page.
        if (activeCategory && !categoryId) {
          setRiddles([]);
          setTotalFiltered(0);
          setLoadError(null);
          return;
        }
        const result = await searchImageRiddles({
          search: search || undefined,
          categoryId: categoryId,
          difficulty: difficulty !== 'all' ? difficulty : undefined,
          page,
          limit: ITEMS_PER_PAGE,
        });
        if (cancelled) return;
        setLoadError(null);
        setRiddles(result.data);
        setTotalFiltered(result.total);
      } catch {
        if (!cancelled) loadOffline();
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [search, activeCategory, categoryId, difficulty, page, sortOrder, shuffleSeed]);

  // Per-category published counts for the sidebar badges. One cheap
  // limit=1 search per category; falls back to counting the offline set.
  useEffect(() => {
    if (categories.length === 0) return;
    let cancelled = false;

    const offlineCounts = () => {
      const counts: Record<string, number> = {};
      OFFLINE_RIDDLES.filter((r) => r.status === 'published').forEach((r) => {
        if (r.category?.name) counts[r.category.name] = (counts[r.category.name] || 0) + 1;
      });
      return counts;
    };

    (async () => {
      const entries = await Promise.all(
        categories.map(async (cat) => {
          try {
            const r = await searchImageRiddles({ categoryId: cat.id, page: 1, limit: 1 });
            return [cat.name, r.total] as const;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const counts: Record<string, number> = {};
      let anyOk = false;
      for (const entry of entries) {
        if (entry) {
          counts[entry[0]] = entry[1];
          anyOk = true;
        }
      }
      setCategoryCounts(anyOk ? counts : offlineCounts());
    })();

    return () => {
      cancelled = true;
    };
  }, [categories]);

  return {
    categories,
    categoryCounts,
    riddles,
    totalFiltered,
    totalPublished,
    totalPages: Math.max(1, Math.ceil(totalFiltered / ITEMS_PER_PAGE)),
    isLoading,
    loadError,
  };
}
