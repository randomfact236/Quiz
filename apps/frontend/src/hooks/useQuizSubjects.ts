'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSubjects } from '@/lib/quiz-api';
import type { Subject } from '@/app/admin/types';

interface UseQuizSubjectsReturn {
  subjects: Subject[];
  total: number;
  isLoading: boolean;
  isEmpty: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useQuizSubjects(): UseQuizSubjectsReturn {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useQuizSubjects] Fetching subjects...');
      const response = await getSubjects(false);
      console.log('[useQuizSubjects] Raw API response:', response);
      
      if (!response) {
        console.log('[useQuizSubjects] Response is null/undefined');
        setSubjects([]);
        setTotal(0);
        setIsLoading(false);
        return;
      }
      
      const loadedSubjects: Subject[] = (response ?? []).map(s => ({
        id: s.id,
        slug: s.slug,
        name: s.name,
        emoji: s.emoji,
        category: (s.category as 'academic' | 'professional' | 'entertainment') || 'academic',
        order: s.order ?? 0,
        isActive: s.isActive ?? true,
      }));
      console.log('[useQuizSubjects] Processed subjects:', loadedSubjects);
      setSubjects(loadedSubjects);
      setTotal(loadedSubjects.length);
    } catch (err) {
      console.error('[useQuizSubjects] Error fetching subjects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subjects');
      setSubjects([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return {
    subjects,
    total,
    isLoading,
    isEmpty: subjects.length === 0,
    error,
    refetch: fetchSubjects,
  };
}
