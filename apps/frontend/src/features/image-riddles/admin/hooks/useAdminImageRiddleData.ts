/**
 * ============================================================================
 * useAdminImageRiddleData — riddle/category state + server load
 * ============================================================================
 * Loads all statuses from /admin/image-riddles and categories from
 * /admin/image-riddles/categories/all; exposes normalized state and the
 * name→id resolver used by create/update payloads.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { toast } from '@/lib/toast';
import { getAllImageRiddlesAdmin, getImageRiddleCategoriesAdmin } from '@/lib/image-riddles-api';
import type { ImageRiddle } from '@/app/admin/types';

/** Category row used by the admin UI (count included). */
export interface AdminImageRiddleCategory {
  id: string;
  name: string;
  emoji: string;
  count: number;
}

/** Default categories (only used as labels before first server load) */
export const defaultCategories: AdminImageRiddleCategory[] = [
  { id: '1', name: 'Optical Illusions', emoji: '👁️', count: 0 },
  { id: '2', name: 'Hidden Objects', emoji: '🔍', count: 0 },
  { id: '3', name: 'Pattern Recognition', emoji: '🔲', count: 0 },
  { id: '4', name: 'Perspective Puzzles', emoji: '📐', count: 0 },
  { id: '5', name: 'Color Observation', emoji: '🎨', count: 0 },
];

export function useAdminImageRiddleData() {
  // State for image riddles — API-backed (all statuses via /admin/image-riddles)
  const [imageRiddles, setImageRiddles] = useState<ImageRiddle[]>([]);

  // Categories state — from /admin/image-riddles/categories/all
  const [categories, setCategories] = useState<AdminImageRiddleCategory[]>(defaultCategories);

  const [isLoadingData, setIsLoadingData] = useState(true);

  /** Load riddles + categories from the backend. */
  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [riddlePage, cats] = await Promise.all([
        getAllImageRiddlesAdmin({}, 1, 500),
        getImageRiddleCategoriesAdmin(),
      ]);
      setImageRiddles(
        riddlePage.data.map((r) => ({
          ...r,
          hint: r.hint ?? '',
          category: r.category ?? undefined,
        }))
      );
      setCategories(
        cats.length > 0
          ? cats.map((c) => ({
              id: c.id,
              name: c.name,
              emoji: c.emoji,
              count: c.riddles?.length ?? 0,
            }))
          : defaultCategories
      );
    } catch {
      toast.error('Failed to load image riddles from server.');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Initial load from backend
  useEffect(() => {
    void loadData();
  }, [loadData]);

  /** Resolve a category UUID from its name for create/update payloads. */
  const categoryIdByName = useCallback(
    (name: string) => categories.find((c) => c.name === name)?.id,
    [categories]
  );

  return {
    imageRiddles,
    setImageRiddles,
    categories,
    setCategories,
    isLoadingData,
    loadData,
    categoryIdByName,
  };
}
