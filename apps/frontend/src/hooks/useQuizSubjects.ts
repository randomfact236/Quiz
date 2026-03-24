'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSubjects } from '@/lib/quiz-api';
import type { Subject } from '@/app/admin/types';

interface UseQuizSubjectsReturn {
  subjects: Subject[];
  refetch: () => Promise<void>;
}

export function useQuizSubjects(): UseQuizSubjectsReturn {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchSubjects = useCallback(async () => {
    try {
      const response = await getSubjects(false);

      if (!response) {
        setSubjects([]);
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

      setSubjects(loadedSubjects);
    } catch (err) {
      console.error('[useQuizSubjects] Error fetching subjects:', err);
      setSubjects([]);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  return {
    subjects,
    refetch: fetchSubjects,
  };
}
