/**
 * ============================================================================
 * USE BULK ACTIONS HOOK - Manage bulk selection and actions
 * ============================================================================
 * @module hooks/useBulkActions
 * @description Enterprise-grade hook for managing bulk selection and actions
 */

'use client';

import { useState, useCallback } from 'react';

import { toast } from '@/lib/toast';
import { StatusService, StatusServiceError } from '@/services/status.service';
import type { BulkActionType } from '@/types/status.types';

/**
 * Hook configuration options
 */
interface UseBulkActionsOptions {
  /** API endpoint for actions */
  endpoint: string;
  /** Callback on success */
  onSuccess?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Optimistic updates (not used in standalone mode but kept for interface compatibility) */
  optimistic?: boolean;
}

/**
 * Hook return type
 */
export interface UseBulkActionsReturn {
  /** Selected item IDs */
  selectedIds: string[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Select a single item */
  selectItem: (id: string) => void;
  /** Deselect a single item */
  deselectItem: (id: string) => void;
  /** Toggle item selection */
  toggleSelection: (id: string) => void;
  /** Select all available items */
  selectAll: (ids: string[]) => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Execute bulk action */
  executeAction: (action: BulkActionType) => Promise<void>;
  /** Retry last failed action */
  retry: () => void;
  /** Number of selected items */
  selectedCount: number;
  /** Whether any items are selected */
  hasSelection: boolean;
  /** Check if all items are selected */
  isAllSelected: (availableIds: string[]) => boolean;
  /** Currently executing action */
  currentAction: BulkActionType | null;
}

/**
 * Hook for managing bulk actions on items
 * @param options - Hook configuration
 * @returns Bulk actions state and handlers
 * @example
 * const {
 *   selectedIds,
 *   toggleSelection,
 *   executeAction,
 *   isLoading,
 * } = useBulkActions({ endpoint: '/quizzes/bulk' });
 */
export function useBulkActions(
  options: UseBulkActionsOptions
): UseBulkActionsReturn {
  const { endpoint, onSuccess, onError } = options;

  // State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentAction, setCurrentAction] = useState<BulkActionType | null>(null);

  /**
   * Selection Handlers
   */
  const selectItem = useCallback((id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  /**
   * Action Handlers
   */
  const executeAction = useCallback(
    async (action: BulkActionType) => {
      if (!selectedIds.length) {return;}

      setIsLoading(true);
      setError(null);
      setCurrentAction(action);

      try {
        const result = await StatusService.executeBulkAction(
          endpoint,
          action,
          selectedIds
        );

        if (result.success) {
          const successMessage = useBulkActions.getSuccessMessage(
            action,
            result.affectedCount
          );
          toast.success(successMessage);
          clearSelection();
          onSuccess?.();
        } else {
          throw new Error('Action completed with errors');
        }
      } catch (err) {
        const errorMessage =
          err instanceof StatusServiceError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'An unexpected error occurred';

        setError(errorMessage);
        toast.error(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setIsLoading(false);
        setCurrentAction(null);
      }
    },
    [endpoint, selectedIds, clearSelection, onSuccess, onError]
  );

  const retry = useCallback(() => {
    if (currentAction) {
      executeAction(currentAction);
    }
  }, [currentAction, executeAction]);

  // Derived state helper
  const isAllSelected = useCallback(
    (availableIds: string[]) => {
      return (
        availableIds.length > 0 &&
        availableIds.every((id) => selectedIds.includes(id))
      );
    },
    [selectedIds]
  );

  return {
    selectedIds,
    isLoading,
    error,
    selectItem,
    deselectItem,
    toggleSelection,
    selectAll,
    clearSelection,
    executeAction,
    retry,
    selectedCount: selectedIds.length,
    hasSelection: selectedIds.length > 0,
    isAllSelected,
    currentAction,
  };
}

// Static helper for success messages
useBulkActions.getSuccessMessage = (
  action: BulkActionType,
  count: number
): string => {
  const s = count === 1 ? '' : 's';
  switch (action) {
    case 'publish':
      return `Succesfully published ${count} item${s}`;
    case 'draft':
      return `Successfully moved ${count} item${s} to drafts`;
    case 'trash':
      return `Successfully moved ${count} item${s} to trash`;
    case 'delete':
      return `Successfully deleted ${count} item${s} permanently`;
    default:
      return `Successfully updated ${count} item${s}`;
  }
};

export default useBulkActions;
