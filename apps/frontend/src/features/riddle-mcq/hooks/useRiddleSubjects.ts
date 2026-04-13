'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  type CreateSubjectDto,
  type UpdateSubjectDto,
} from '@/lib/riddle-mcq-api';

const SUBJECTS_KEY = ['riddle-subjects'];
const RIDDLES_KEY = ['riddle-riddles'];
const FILTER_COUNTS_KEY = ['riddle-filter-counts'];

export function useRiddleSubjects(hasContentOnly: boolean = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...SUBJECTS_KEY, hasContentOnly],
    queryFn: () => getSubjects(hasContentOnly),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSubjectDto) => createSubject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubjectDto }) => updateSubject(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
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

export default useRiddleSubjects;
