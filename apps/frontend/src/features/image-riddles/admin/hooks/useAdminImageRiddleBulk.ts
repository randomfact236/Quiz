/**
 * ============================================================================
 * useAdminImageRiddleBulk — row selection + bulk actions + status cycling
 * ============================================================================
 * Selection state for the table and all status mutations routed through
 * POST /image-riddles/bulk-action, including the per-row status click-cycle.
 * ============================================================================
 */

'use client';

import { useCallback, useState } from 'react';

import { toast } from '@/lib/toast';
import { bulkActionImageRiddles, type ImageRiddleBulkAction } from '@/lib/image-riddles-api';
import type { BulkActionType, ContentStatus, ImageRiddle } from '@/app/admin/types';

import { nextStatusCycle } from '../lib/filters';

export interface UseAdminImageRiddleBulkArgs {
  allFilteredIds: string[];
  setImageRiddles: React.Dispatch<React.SetStateAction<ImageRiddle[]>>;
  loadData: () => Promise<void>;
}

export function useAdminImageRiddleBulk({
  allFilteredIds,
  setImageRiddles,
  loadData,
}: UseAdminImageRiddleBulkArgs) {
  // Selection and bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState<boolean>(false);

  // Selection handlers
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(allFilteredIds);
  }, [allFilteredIds]);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Bulk action handler — routed through POST /image-riddles/bulk-action
  const handleBulkAction = useCallback(
    async (action: BulkActionType) => {
      if (selectedIds.length === 0) return;
      setBulkActionLoading(true);

      try {
        await bulkActionImageRiddles(selectedIds, action as ImageRiddleBulkAction);

        setImageRiddles((prev) =>
          prev.flatMap((riddle) => {
            if (!selectedIds.includes(riddle.id)) return [riddle];
            switch (action) {
              case 'publish':
                return [{ ...riddle, status: 'published' as ContentStatus }];
              case 'draft':
              case 'restore':
                return [{ ...riddle, status: 'draft' as ContentStatus }];
              case 'trash':
                return [{ ...riddle, status: 'trash' as ContentStatus }];
              case 'delete':
                return [];
              default:
                return [riddle];
            }
          })
        );

        setSelectedIds([]);
        toast.success(`✅ Bulk ${action} complete`);
      } catch {
        toast.error(`Bulk ${action} failed — reloading from server.`);
        await loadData();
      } finally {
        setBulkActionLoading(false);
      }
    },
    [selectedIds, setImageRiddles, loadData]
  );

  /** Row-level status click-cycle: published → draft → trash → published. */
  const cycleStatus = useCallback(
    async (riddle: ImageRiddle) => {
      const nextStatus = nextStatusCycle(riddle.status);
      const action: ImageRiddleBulkAction =
        nextStatus === 'published' ? 'publish' : nextStatus === 'draft' ? 'draft' : 'trash';
      try {
        await bulkActionImageRiddles([riddle.id], action);
        setImageRiddles((prev) =>
          prev.map((r) => (r.id === riddle.id ? { ...r, status: nextStatus } : r))
        );
        toast.success(`👁️ Status changed to ${nextStatus.toUpperCase()}`);
      } catch {
        toast.error('Status change failed.');
      }
    },
    [setImageRiddles]
  );

  return {
    selectedIds,
    setSelectedIds,
    bulkActionLoading,
    toggleSelection,
    selectAll,
    deselectAll,
    handleBulkAction,
    cycleStatus,
  };
}
