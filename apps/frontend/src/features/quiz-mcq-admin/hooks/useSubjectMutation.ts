'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createSubject,
  updateSubject,
  deleteSubject,
  type CreateSubjectDto,
  type UpdateSubjectDto,
} from '@/lib/quiz-mcq-api';
import { QUIZ_MCQ_PUBLIC_QUERY_PREFIX } from '@/lib/quiz-mcq-constants';

const SUBJECTS_KEY = 'subjects';
const CHAPTERS_KEY = 'chapters';
const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

export function useSubjectMutation() {
  const queryClient = useQueryClient();

  const invalidatePublicQuizCache = () =>
    queryClient.invalidateQueries({ queryKey: [QUIZ_MCQ_PUBLIC_QUERY_PREFIX] });

  const createMutation = useMutation({
    mutationFn: (dto: CreateSubjectDto) => createSubject(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubjectDto }) => updateSubject(id, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SUBJECTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  return {
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
    isError: createMutation.isError || updateMutation.isError || deleteMutation.isError,
  };
}

export default useSubjectMutation;
