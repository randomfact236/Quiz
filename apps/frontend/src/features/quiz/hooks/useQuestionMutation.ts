'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createQuestion, 
  updateQuestion, 
  deleteQuestion,
  bulkActionQuestions,
  createQuestionsBulk,
  type CreateQuestionDto,
  type UpdateQuestionDto
} from '@/lib/quiz-api';

const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

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
    mutationFn: ({ id, dto }: { id: string; dto: UpdateQuestionDto }) => updateQuestion(id, dto, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteQuestion(id, true),
    onSuccess: () => {
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
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'publish' | 'draft' | 'trash' }) => 
      bulkActionQuestions(ids, action, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (dtos: CreateQuestionDto[]) => createQuestionsBulk(dtos, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  return {
    // Create single
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
    
    // Update
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    // Delete single
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
    
    // Bulk create
    bulkCreate: bulkCreateMutation.mutate,
    bulkCreateAsync: bulkCreateMutation.mutateAsync,
    isBulkCreating: bulkCreateMutation.isPending,
    bulkCreateError: bulkCreateMutation.error,
    
    // Bulk delete
    bulkDelete: bulkDeleteMutation.mutate,
    bulkDeleteAsync: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    bulkDeleteError: bulkDeleteMutation.error,
    
    // Bulk update status
    bulkUpdateStatus: bulkUpdateStatusMutation.mutate,
    bulkUpdateStatusAsync: bulkUpdateStatusMutation.mutateAsync,
    isBulkUpdatingStatus: bulkUpdateStatusMutation.isPending,
    bulkUpdateStatusError: bulkUpdateStatusMutation.error,
    
    // Combined processing state
    isProcessing: createMutation.isPending || 
                  updateMutation.isPending || 
                  deleteMutation.isPending ||
                  bulkCreateMutation.isPending ||
                  bulkDeleteMutation.isPending ||
                  bulkUpdateStatusMutation.isPending,
    
    // Combined error state
    isError: createMutation.isError || 
             updateMutation.isError || 
             deleteMutation.isError ||
             bulkCreateMutation.isError ||
             bulkDeleteMutation.isError ||
             bulkUpdateStatusMutation.isError,
  };
}

export default useQuestionMutation;
