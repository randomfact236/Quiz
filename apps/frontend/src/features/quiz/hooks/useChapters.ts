'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getAllChapters,
  getChaptersBySubject, 
  createChapter, 
  updateChapter, 
  deleteChapter,
  type QuizChapter,
  type CreateChapterDto
} from '@/lib/quiz-api';

const CHAPTERS_KEY = 'chapters';
const QUESTIONS_KEY = 'questions';
const FILTER_COUNTS_KEY = 'filter-counts';

export function useChapters(subjectId: string | null | undefined) {
  const queryClient = useQueryClient();

  // Query - fetches all chapters when subjectId is null/undefined, or filtered by subject when provided
  const query = useQuery({
    queryKey: [CHAPTERS_KEY, subjectId],
    queryFn: () => subjectId ? getChaptersBySubject(subjectId) : getAllChapters(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: (dto: CreateChapterDto) => createChapter(dto, true),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, dto.subjectId] as const });
      
      const previousChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, dto.subjectId]);
      
      const tempChapter: QuizChapter = {
        id: `temp-${Date.now()}`,
        name: dto.name,
        subjectId: dto.subjectId,
        chapterNumber: (previousChapters?.length || 0) + 1,
      };
      
      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, dto.subjectId], (old = []) => [...old, tempChapter]);
      
      return { previousChapters };
    },
    onError: (_err, dto, context) => {
      if (context?.previousChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, dto.subjectId], context.previousChapters);
      }
    },
    onSettled: (_data, _error, dto) => {
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, dto.subjectId] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  // Update mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { name?: string; subjectId?: string } }) => updateChapter(id, dto, true),
    onMutate: async ({ id, dto }) => {
      const subjId = dto.subjectId;
      if (!subjId) return;
      
      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, subjId] as const });
      
      const previousChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId]);
      
      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId], (old = []) => 
        old.map(chapter => chapter.id === id ? { ...chapter, ...dto } : chapter)
      );
      
      return { previousChapters };
    },
    onError: (_err, { dto }, context) => {
      if (dto.subjectId && context?.previousChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, dto.subjectId], context.previousChapters);
      }
    },
    onSettled: (_data, _error, { dto }) => {
      if (dto.subjectId) {
        queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, dto.subjectId] });
        queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
      }
    },
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: ({ id }: { id: string; subjectId: string }) => deleteChapter(id, true),
    onMutate: async ({ id, subjectId: subjId }) => {
      await queryClient.cancelQueries({ queryKey: [CHAPTERS_KEY, subjId] as const });
      
      const previousChapters = queryClient.getQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId]);
      
      queryClient.setQueryData<QuizChapter[]>([CHAPTERS_KEY, subjId], (old = []) => 
        old.filter(chapter => chapter.id !== id)
      );
      
      return { previousChapters };
    },
    onError: (_err, { subjectId: subjId }, context) => {
      if (context?.previousChapters) {
        queryClient.setQueryData([CHAPTERS_KEY, subjId], context.previousChapters);
      }
    },
    onSettled: (_data, _error, { subjectId: subjId }) => {
      // Invalidate chapters, questions, and filter counts
      queryClient.invalidateQueries({ queryKey: [CHAPTERS_KEY, subjId] });
      queryClient.invalidateQueries({ queryKey: [QUESTIONS_KEY] });
      queryClient.invalidateQueries({ queryKey: [FILTER_COUNTS_KEY] });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
}

export default useChapters;
