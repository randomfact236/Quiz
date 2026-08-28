/**
 * ============================================================================
 * useAdminImageRiddleDelete — trash confirm, permanent delete, undo
 * ============================================================================
 * Owns the trash-confirmation modal target and the 5.5s undo window for
 * trash moves, preserving the original ref-based undo semantics.
 * ============================================================================
 */

'use client';

import { useCallback, useRef, useState } from 'react';

import { toast } from '@/lib/toast';
import { bulkActionImageRiddles } from '@/lib/image-riddles-api';
import type { ImageRiddle } from '@/app/admin/types';

export interface UseAdminImageRiddleDeleteArgs {
  setImageRiddles: React.Dispatch<React.SetStateAction<ImageRiddle[]>>;
  loadData: () => Promise<void>;
}

export function useAdminImageRiddleDelete({
  setImageRiddles,
  loadData,
}: UseAdminImageRiddleDeleteArgs) {
  const [showTrashConfirm, setShowTrashConfirm] = useState<boolean>(false);
  const [trashTarget, setTrashTarget] = useState<ImageRiddle | null>(null);

  // Undo delete reference
  const lastDeletedRef = useRef<ImageRiddle | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const openTrashConfirm = useCallback((riddle: ImageRiddle) => {
    setTrashTarget(riddle);
    setShowTrashConfirm(true);
  }, []);

  const cancelTrashConfirm = useCallback(() => {
    setShowTrashConfirm(false);
    setTrashTarget(null);
  }, []);

  const handleTrashImageRiddle = useCallback(async () => {
    if (!trashTarget) {
      return;
    }

    try {
      if (trashTarget.status === 'trash') {
        // Permanent delete if already in trash
        await bulkActionImageRiddles([trashTarget.id], 'delete');
        setImageRiddles((prev) => prev.filter((r) => r.id !== trashTarget.id));
        toast.success('Riddle permanently deleted.');
      } else {
        // Move to trash; remember previous status so Undo can restore it
        lastDeletedRef.current = { ...trashTarget };
        undoTimeoutRef.current = setTimeout(() => {
          lastDeletedRef.current = null;
        }, 5500);

        await bulkActionImageRiddles([trashTarget.id], 'trash');
        setImageRiddles((prev) =>
          prev.map((r) =>
            r.id === trashTarget.id ? { ...r, status: 'trash' as ImageRiddle['status'] } : r
          )
        );
        toast.success('Riddle moved to trash. (Undo available)', 5000);
      }
    } catch {
      toast.error('Failed to update riddle — reloading.');
      await loadData();
    }

    setShowTrashConfirm(false);
    setTrashTarget(null);
  }, [trashTarget, setImageRiddles, loadData]);

  const handleUndoDelete = useCallback(async () => {
    if (lastDeletedRef.current) {
      const restored = lastDeletedRef.current;
      try {
        await bulkActionImageRiddles(
          [restored.id],
          restored.status === 'published' ? 'publish' : 'restore'
        );
        setImageRiddles((prev) =>
          prev.map((r) => (r.id === restored.id ? { ...r, status: restored.status } : r))
        );
        lastDeletedRef.current = null;
        toast.success('Riddle restored!');
      } catch {
        toast.error('Failed to restore riddle.');
      }
    } else {
      toast.error('Nothing to undo.');
    }
  }, [setImageRiddles]);

  return {
    showTrashConfirm,
    trashTarget,
    lastDeletedRef,
    openTrashConfirm,
    cancelTrashConfirm,
    handleTrashImageRiddle,
    handleUndoDelete,
  };
}
