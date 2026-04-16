'use client';

import { useCallback } from 'react';
import { useRiddleMutations } from './useRiddleMutations';
import type { BulkActionType } from '@/types/status.types';

export function useBulkActions(selectedIds: Set<string>, onClearSelection: () => void) {
  const { bulkAction } = useRiddleMutations();

  const handleBulkAction = useCallback(
    async (action: BulkActionType) => {
      if (selectedIds.size === 0) return;
      await bulkAction({ ids: Array.from(selectedIds), action });
      onClearSelection();
    },
    [selectedIds, bulkAction, onClearSelection]
  );

  return { handleBulkAction };
}
