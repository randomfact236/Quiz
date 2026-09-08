'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkActionQuestions,
  createQuestionsBulkFromImport,
  type CreateQuestionDto,
  type UpdateQuestionDto,
  type BulkQuestionDto,
} from '@/lib/quiz-mcq-api';
import { QUIZ_MCQ_PUBLIC_QUERY_PREFIX } from '@/lib/quiz-mcq-constants';

const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

export function useQuestionMutation() {
  const queryClient = useQueryClient();

  const invalidatePublicQuizCache = () =>
    queryClient.invalidateQueries({ queryKey: [QUIZ_MCQ_PUBLIC_QUERY_PREFIX] });

  const createMutation = useMutation({
    mutationFn: (dto: CreateQuestionDto) => createQuestion(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuestionDto }) => updateQuestion(id, dto),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(id),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkActionQuestions(ids, 'delete'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: 'publish' | 'draft' | 'trash' | 'restore';
    }) => bulkActionQuestions(ids, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (dto: BulkQuestionDto) => createQuestionsBulkFromImport(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      invalidatePublicQuizCache();
    },
  });

  return {
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    bulkCreateAsync: bulkCreateMutation.mutateAsync,
    isBulkCreating: bulkCreateMutation.isPending,
    bulkCreateError: bulkCreateMutation.error,

    bulkDeleteAsync: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    bulkDeleteError: bulkDeleteMutation.error,

    bulkUpdateStatusAsync: bulkUpdateStatusMutation.mutateAsync,
    isBulkUpdatingStatus: bulkUpdateStatusMutation.isPending,
    bulkUpdateStatusError: bulkUpdateStatusMutation.error,

    isProcessing:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending ||
      bulkCreateMutation.isPending ||
      bulkDeleteMutation.isPending ||
      bulkUpdateStatusMutation.isPending,

    isError:
      createMutation.isError ||
      updateMutation.isError ||
      deleteMutation.isError ||
      bulkCreateMutation.isError ||
      bulkDeleteMutation.isError ||
      bulkUpdateStatusMutation.isError,
  };
}

export default useQuestionMutation;
