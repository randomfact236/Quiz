/**
 * ============================================================================
 * useAdminImageRiddleCategories — category modal state + CRUD handlers
 * ============================================================================
 * Add/edit/delete category flows, preserving the original behavior:
 * optimistic local updates, riddle propagation on rename, filter fixup,
 * and a full data reload after delete (riddles are archived server-side).
 * ============================================================================
 */

'use client';

import { useCallback, useState } from 'react';

import { toast } from '@/lib/toast';
import {
  createImageRiddleCategory,
  deleteImageRiddleCategory,
  updateImageRiddleCategory,
} from '@/lib/image-riddles-api';
import type { ImageRiddle } from '@/app/admin/types';

import type { AdminImageRiddleCategory } from './useAdminImageRiddleData';

export interface UseAdminImageRiddleCategoriesArgs {
  setCategories: React.Dispatch<React.SetStateAction<AdminImageRiddleCategory[]>>;
  setImageRiddles: React.Dispatch<React.SetStateAction<ImageRiddle[]>>;
  loadData: () => Promise<void>;
  filterCategory: string;
  setFilterCategory: (category: string) => void;
}

export function useAdminImageRiddleCategories({
  setCategories,
  setImageRiddles,
  loadData,
  filterCategory,
  setFilterCategory,
}: UseAdminImageRiddleCategoriesArgs) {
  // Category Modal States
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AdminImageRiddleCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', emoji: '' });

  /** Set up the edit modal for a category (used by the row edit button). */
  const openEditCategory = useCallback((cat: AdminImageRiddleCategory) => {
    setSelectedCategory(cat);
    setCategoryForm({ name: cat.name, emoji: cat.emoji });
    setShowEditCategoryModal(true);
  }, []);

  /** Set up the delete confirmation for a category. */
  const openDeleteCategory = useCallback((cat: AdminImageRiddleCategory) => {
    setSelectedCategory(cat);
    setShowDeleteCategoryConfirm(true);
  }, []);

  const openAddCategory = useCallback(() => {
    setCategoryForm({ name: '', emoji: '' });
    setShowAddCategoryModal(true);
  }, []);

  const closeCategoryModals = useCallback(() => {
    setShowAddCategoryModal(false);
    setShowEditCategoryModal(false);
  }, []);

  const handleAddCategory = async () => {
    if (!categoryForm.name.trim()) return;
    try {
      const created = await createImageRiddleCategory({
        name: categoryForm.name.trim(),
        ...(categoryForm.emoji ? { emoji: categoryForm.emoji } : {}),
      });
      setCategories((prev) => [
        ...prev,
        { id: created.id, name: created.name, emoji: created.emoji, count: 0 },
      ]);
      setShowAddCategoryModal(false);
      setCategoryForm({ name: '', emoji: '' });
      toast.success('Category created!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !categoryForm.name.trim()) return;
    const oldName = selectedCategory.name;
    const newName = categoryForm.name.trim();
    const newEmoji = categoryForm.emoji;

    try {
      await updateImageRiddleCategory(selectedCategory.id, { name: newName, emoji: newEmoji });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category');
      return;
    }

    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === selectedCategory.id ? { ...cat, name: newName, emoji: newEmoji } : cat
      )
    );

    // Propagate changes to riddles
    setImageRiddles((prev) =>
      prev.map((r) =>
        r.category?.name === oldName
          ? { ...r, category: { ...r.category!, name: newName, emoji: newEmoji } }
          : r
      )
    );

    if (filterCategory === oldName) setFilterCategory(newName);

    setShowEditCategoryModal(false);
    setSelectedCategory(null);
    toast.success('✏️ Category updated!');
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    const categoryName = selectedCategory.name;

    try {
      // Backend soft-deletes (archives) the active riddles in this category.
      await deleteImageRiddleCategory(selectedCategory.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete category');
      return;
    }

    setCategories((prev) => prev.filter((cat) => cat.id !== selectedCategory.id));

    // Riddles were archived server-side — refresh to reflect their new state.
    await loadData();

    if (filterCategory === categoryName) setFilterCategory('');

    setShowDeleteCategoryConfirm(false);
    setSelectedCategory(null);
    toast.success('🗑️ Category deleted.');
  };

  return {
    showAddCategoryModal,
    setShowAddCategoryModal,
    showEditCategoryModal,
    setShowEditCategoryModal,
    showDeleteCategoryConfirm,
    setShowDeleteCategoryConfirm,
    selectedCategory,
    setSelectedCategory,
    categoryForm,
    setCategoryForm,
    openEditCategory,
    openDeleteCategory,
    openAddCategory,
    closeCategoryModals,
    handleAddCategory,
    handleEditCategory,
    handleDeleteCategory,
  };
}
