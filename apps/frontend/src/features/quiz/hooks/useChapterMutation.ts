'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  createChapter, 
  updateChapter, 
  deleteChapter,
  type CreateChapterDto
} from '@/lib/quiz-api';

const CHAPTERS_KEY = 'chapters';
const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

export function useChapterMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (dto: CreateChapterDto) => createChapter(dto, true),
    onSuccess: (_data, dto) => {
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, dto.subjectId] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; subjectId?: string } }) => 
      updateChapter(id, dto, true),
    onSuccess: (_data, { dto }) => {
      if (dto.subjectId) {
        queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, dto.subjectId] });
      }
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteChapter(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY] });
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
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

export default useChapterMutation;
