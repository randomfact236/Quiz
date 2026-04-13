'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  type CreateCategoryDto,
  type UpdateCategoryDto,
} from '@/lib/riddle-mcq-api';

const CATEGORIES_KEY = ['riddle-mcq-categories'];
const SUBJECTS_KEY = ['riddle-mcq-subjects'];
const RIDDLES_KEY = ['riddle-mcq-questions'];
const FILTER_COUNTS_KEY = ['riddle-mcq-filter-counts'];

export function useRiddleMcqCategories() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: () => getCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateCategoryDto) => createCategory(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCategoryDto }) => updateCategory(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
      queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: RIDDLES_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    // Create
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Combined states
    isPending: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    hasError: createMutation.isError || updateMutation.isError || deleteMutation.isError,
  };
}

export default useRiddleMcqCategories;
