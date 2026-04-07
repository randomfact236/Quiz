'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubjects, deleteSubject, type QuizSubject } from '@/lib/quiz-api';

const SUBJECTS_KEY = ['subjects'];
const FILTER_COUNTS_KEY = ['filter-counts'];

export function useSubjects() {
  const queryClient = useQueryClient();

  // Query
  const query = useQuery({
    queryKey: SUBJECTS_KEY,
    queryFn: () => getSubjects(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Delete mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubject(id, true),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: SUBJECTS_KEY });

      const previousSubjects = queryClient.getQueryData<QuizSubject[]>(SUBJECTS_KEY);

      queryClient.setQueryData<QuizSubject[]>(SUBJECTS_KEY, (old = []) =>
        old.filter((subject) => subject.id !== id)
      );

      return { previousSubjects };
    },
    onError: (_err, _id, context) => {
      if (context?.previousSubjects) {
        queryClient.setQueryData(SUBJECTS_KEY, context.previousSubjects);
      }
    },
    onSettled: () => {
      // Invalidate subjects, chapters, questions, and filter counts
      queryClient.invalidateQueries({ queryKey: SUBJECTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      queryClient.invalidateQueries({ queryKey: FILTER_COUNTS_KEY });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    delete: deleteMutation.mutateAsync,
    // Mutation states
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,
  };
}

export default useSubjects;
