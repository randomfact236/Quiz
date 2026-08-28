/**
 * ============================================================================
 * useAdminImageRiddleMutations — create/update/duplicate riddle handlers
 * ============================================================================
 * Pure-ish handlers consuming the form/modal state from
 * useAdminImageRiddleForm. Status changes are routed through the bulk-action
 * surface exactly as before.
 * ============================================================================
 */

'use client';

import { useCallback } from 'react';

import { toast } from '@/lib/toast';
import {
  bulkActionImageRiddles,
  createImageRiddle,
  updateImageRiddle,
} from '@/lib/image-riddles-api';
import type { ContentStatus, ImageRiddle } from '@/app/admin/types';

import {
  defaultFormState,
  isRiddleFormComplete,
  parseTimerSeconds,
  type RiddleFormState,
} from '../lib/form';

import type { AdminImageRiddleCategory } from './useAdminImageRiddleData';

export interface UseAdminImageRiddleMutationsArgs {
  categories: AdminImageRiddleCategory[];
  setImageRiddles: React.Dispatch<React.SetStateAction<ImageRiddle[]>>;
  categoryIdByName: (name: string) => string | undefined;
  riddleForm: RiddleFormState;
  setRiddleForm: React.Dispatch<React.SetStateAction<RiddleFormState>>;
  selectedRiddle: ImageRiddle | null;
  setSelectedRiddle: (riddle: ImageRiddle | null) => void;
  setShowAddModal: (open: boolean) => void;
  setShowEditModal: (open: boolean) => void;
  setIsSaving: (saving: boolean) => void;
}

export function useAdminImageRiddleMutations({
  categories,
  setImageRiddles,
  categoryIdByName,
  riddleForm,
  setRiddleForm,
  selectedRiddle,
  setSelectedRiddle,
  setShowAddModal,
  setShowEditModal,
  setIsSaving,
}: UseAdminImageRiddleMutationsArgs) {
  const handleAddRiddle = useCallback(async () => {
    if (!isRiddleFormComplete(riddleForm)) {
      return;
    }

    setIsSaving(true);
    try {
      const created = await createImageRiddle({
        title: riddleForm.title.trim(),
        imageUrl: riddleForm.imageUrl.trim(),
        answer: riddleForm.answer.trim(),
        hint: riddleForm.hint.trim() || undefined,
        difficulty: riddleForm.difficulty,
        timerSeconds: parseTimerSeconds(riddleForm.timerSeconds),
        showTimer: riddleForm.showTimer,
        categoryId: categoryIdByName(riddleForm.categoryName) ?? null,
      });

      // Backend creates as DRAFT; publish immediately if the form asked for it.
      if (riddleForm.status === 'published') {
        await bulkActionImageRiddles([created.id], 'publish');
        created.status = 'published';
      }

      setImageRiddles((prev) => [
        ...prev,
        { ...created, hint: created.hint ?? '', category: created.category ?? undefined },
      ]);
      setShowAddModal(false);
      setRiddleForm(defaultFormState);
      toast.success('✨ Riddle added successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create riddle');
    } finally {
      setIsSaving(false);
    }
  }, [riddleForm, categoryIdByName, setIsSaving, setImageRiddles, setRiddleForm, setShowAddModal]);

  const handleEditRiddle = useCallback(async () => {
    if (!selectedRiddle || !isRiddleFormComplete(riddleForm)) {
      return;
    }

    setIsSaving(true);
    try {
      const nextStatus = (riddleForm.status || selectedRiddle.status) as ContentStatus;
      const updated = await updateImageRiddle(selectedRiddle.id, {
        title: riddleForm.title.trim(),
        imageUrl: riddleForm.imageUrl.trim(),
        answer: riddleForm.answer.trim(),
        hint: riddleForm.hint.trim() || undefined,
        difficulty: riddleForm.difficulty,
        timerSeconds: parseTimerSeconds(riddleForm.timerSeconds),
        showTimer: riddleForm.showTimer,
        isActive: riddleForm.isActive,
        categoryId: categoryIdByName(riddleForm.categoryName) ?? null,
      });

      // Status changes go through the bulk-action surface.
      if (selectedRiddle.status !== nextStatus) {
        if (nextStatus === 'trash') {
          await bulkActionImageRiddles([selectedRiddle.id], 'trash');
        } else if (nextStatus === 'draft') {
          await bulkActionImageRiddles([selectedRiddle.id], 'draft');
        } else {
          await bulkActionImageRiddles([selectedRiddle.id], 'publish');
        }
        updated.status = nextStatus;
      }

      const categoryEmoji =
        categories.find((c) => c.name === riddleForm.categoryName)?.emoji ||
        riddleForm.categoryEmoji ||
        '❓';
      setImageRiddles((prev) =>
        prev.map((r) =>
          r.id === selectedRiddle.id
            ? {
                ...updated,
                status: updated.status ?? r.status,
                category: { name: riddleForm.categoryName, emoji: categoryEmoji },
                hint: updated.hint ?? '',
              }
            : r
        )
      );
      setShowEditModal(false);
      setSelectedRiddle(null);
      setRiddleForm(defaultFormState);
      toast.success('✏️ Riddle updated successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update riddle');
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedRiddle,
    riddleForm,
    categoryIdByName,
    categories,
    setIsSaving,
    setImageRiddles,
    setRiddleForm,
    setSelectedRiddle,
    setShowEditModal,
  ]);

  const handleDuplicateRiddle = useCallback(
    async (riddle: ImageRiddle) => {
      setIsSaving(true);
      try {
        const created = await createImageRiddle({
          title: `${riddle.title} (Copy)`,
          imageUrl: riddle.imageUrl,
          answer: riddle.answer,
          hint: riddle.hint || undefined,
          difficulty: riddle.difficulty,
          timerSeconds: riddle.timerSeconds ?? null,
          showTimer: riddle.showTimer ?? true,
          categoryId: riddle.categoryId ?? categoryIdByName(riddle.category?.name || '') ?? null,
        });
        setImageRiddles((prev) => [
          ...prev,
          { ...created, hint: created.hint ?? '', category: created.category ?? undefined },
        ]);
        toast.success('Riddle duplicated as draft!');
      } catch {
        toast.error('Failed to duplicate riddle.');
      } finally {
        setIsSaving(false);
      }
    },
    [categoryIdByName, setIsSaving, setImageRiddles]
  );

  return { handleAddRiddle, handleEditRiddle, handleDuplicateRiddle };
}
