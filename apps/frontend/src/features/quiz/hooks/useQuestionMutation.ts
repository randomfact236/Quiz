'use client';

import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkActionQuestions,
  createQuestionsBulkFromImport,
  type CreateQuestionDto,
  type UpdateQuestionDto,
  type QuizQuestion,
  type BulkQuestionDto,
} from '@/lib/quiz-api';

const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

interface QuestionsPage {
  data: QuizQuestion[];
  total: number;
  nextCursor?: string;
  hasMore?: boolean;
}

export function useQuestionMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (dto: CreateQuestionDto) => createQuestion(dto, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuestionDto }) =>
      updateQuestion(id, dto, true),
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: [QUESTIONS_KEY] });

      const previous = queryClient.getQueryData([QUESTIONS_KEY]);

      queryClient.setQueriesData(
        { queryKey: [QUESTIONS_KEY] },
        (old: InfiniteData<QuestionsPage> | undefined) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((q: QuizQuestion) => (q.id === id ? { ...q, ...dto } : q)),
            })),
          };
        }
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUESTIONS_KEY], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(id, true),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: [QUESTIONS_KEY] });
      const previous = queryClient.getQueryData([QUESTIONS_KEY]);

      queryClient.setQueriesData(
        { queryKey: [QUESTIONS_KEY] },
        (old: InfiniteData<QuestionsPage> | undefined) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((q: QuizQuestion) => q.id !== id),
            })),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData([QUESTIONS_KEY], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => bulkActionQuestions(ids, 'delete', true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
    onError: (error) => {
      console.error('[BulkAction] Delete failed:', error);
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({
      ids,
      action,
    }: {
      ids: string[];
      action: 'publish' | 'draft' | 'trash' | 'restore';
    }) => bulkActionQuestions(ids, action, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
    onError: (error) => {
      console.error('[BulkAction] Status update failed:', error);
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (dto: BulkQuestionDto) => createQuestionsBulkFromImport(dto, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
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

    bulkCreate: bulkCreateMutation.mutate,
    bulkCreateAsync: bulkCreateMutation.mutateAsync,
    isBulkCreating: bulkCreateMutation.isPending,
    bulkCreateError: bulkCreateMutation.error,

    bulkDelete: bulkDeleteMutation.mutate,
    bulkDeleteAsync: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    bulkDeleteError: bulkDeleteMutation.error,

    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
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
