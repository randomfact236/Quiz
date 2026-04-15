'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  bulkActionRiddles,
  createCategory,
  updateCategory,
  deleteCategory,
  createSubject,
  updateSubject,
  deleteSubject,
  createRiddle,
  updateRiddle,
  deleteRiddle,
} from '@/lib/riddle-mcq-api';
import type { CreateCategoryDto, CreateSubjectDto, CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';

export function useRiddleMutations() {
  const queryClient = useQueryClient();

  const createCategoryMutation = useMutation({
    mutationFn: (dto: CreateCategoryDto) => createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateCategoryDto> }) =>
      updateCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const createSubjectMutation = useMutation({
    mutationFn: (dto: CreateSubjectDto) => createSubject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateSubjectDto> }) =>
      updateSubject(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-subjects'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const createRiddleMutation = useMutation({
    mutationFn: (dto: CreateRiddleMcqDto) => createRiddle(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const updateRiddleMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateRiddleMcqDto> }) =>
      updateRiddle(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const deleteRiddleMutation = useMutation({
    mutationFn: (id: string) => deleteRiddle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  const bulkActionMutation = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: 'delete' | 'trash' | 'publish' | 'draft' | 'restore';
    }) => bulkActionRiddles(ids, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
    },
  });

  return {
    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    createSubject: createSubjectMutation.mutateAsync,
    updateSubject: updateSubjectMutation.mutateAsync,
    deleteSubject: deleteSubjectMutation.mutateAsync,
    createRiddle: createRiddleMutation.mutateAsync,
    updateRiddle: updateRiddleMutation.mutateAsync,
    deleteRiddle: deleteRiddleMutation.mutateAsync,
    bulkAction: bulkActionMutation.mutateAsync,
    isBulkActionLoading: bulkActionMutation.isPending,
    isUpdateRiddleLoading: updateRiddleMutation.isPending,
  };
}
