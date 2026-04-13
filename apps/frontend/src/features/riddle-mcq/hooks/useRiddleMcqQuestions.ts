'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAllRiddles,
  createRiddle,
  updateRiddle,
  deleteRiddle,
  type CreateRiddleMcqDto,
  type UpdateRiddleMcqDto,
  type GetRiddlesParams,
} from '@/lib/riddle-mcq-api';

const RIDDLES_KEY = ['riddle-mcq-questions'];
const FILTER_COUNTS_KEY = ['riddle-mcq-filter-counts'];

export function useRiddleMcqQuestions(
  filters: GetRiddlesParams = {},
  page: number = 1,
  pageSize: number = 10
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...RIDDLES_KEY, filters, page, pageSize],
    queryFn: () => getAllRiddles(filters, page, pageSize),
    staleTime: 30 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateRiddleMcqDto) => createRiddle(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDDLES_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateRiddleMcqDto }) => updateRiddle(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDDLES_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRiddle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RIDDLES_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  return {
    data: query.data ?? { data: [], total: 0 },
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

export default useRiddleMcqQuestions;
