/**
 * ============================================================================
 * useAdminImageRiddleForm — form/modal state + composition of mutations
 * ============================================================================
 * Owns the form state, add/edit modal visibility, media-picker state, and
 * the edit-modal opener; delegates the create/update/duplicate handlers to
 * useAdminImageRiddleMutations.
 * ============================================================================
 */

'use client';

import { useCallback, useRef, useState } from 'react';

import { useClickOutside } from '@/hooks/useClickOutside';
import type { ImageRiddle } from '@/app/admin/types';

import { defaultFormState, riddleToFormState, type RiddleFormState } from '../lib/form';

import type { AdminImageRiddleCategory } from './useAdminImageRiddleData';
import { useAdminImageRiddleMutations } from './useAdminImageRiddleMutations';

export interface UseAdminImageRiddleFormArgs {
  categories: AdminImageRiddleCategory[];
  setImageRiddles: React.Dispatch<React.SetStateAction<ImageRiddle[]>>;
  categoryIdByName: (name: string) => string | undefined;
  setIsSaving: (saving: boolean) => void;
}

export function useAdminImageRiddleForm({
  categories,
  setImageRiddles,
  categoryIdByName,
  setIsSaving,
}: UseAdminImageRiddleFormArgs) {
  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showMediaPicker, setShowMediaPicker] = useState<boolean>(false);
  const [selectedRiddle, setSelectedRiddle] = useState<ImageRiddle | null>(null);

  // Form state
  const [riddleForm, setRiddleForm] = useState<RiddleFormState>(defaultFormState);

  // Refs
  const addModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);

  useClickOutside(
    addModalRef,
    () => {
      setShowAddModal(false);
      setRiddleForm(defaultFormState);
    },
    showAddModal
  );

  useClickOutside(
    editModalRef,
    () => {
      setShowEditModal(false);
      setSelectedRiddle(null);
      setRiddleForm(defaultFormState);
    },
    showEditModal
  );

  const { handleAddRiddle, handleEditRiddle, handleDuplicateRiddle } = useAdminImageRiddleMutations(
    {
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
    }
  );

  const openEditModal = useCallback((riddle: ImageRiddle) => {
    setSelectedRiddle(riddle);
    setRiddleForm(riddleToFormState(riddle));
    setShowEditModal(true);
  }, []);

  return {
    showAddModal,
    setShowAddModal,
    showEditModal,
    setShowEditModal,
    showMediaPicker,
    setShowMediaPicker,
    selectedRiddle,
    setSelectedRiddle,
    riddleForm,
    setRiddleForm,
    addModalRef,
    editModalRef,
    handleAddRiddle,
    handleEditRiddle,
    handleDuplicateRiddle,
    openEditModal,
  };
}
