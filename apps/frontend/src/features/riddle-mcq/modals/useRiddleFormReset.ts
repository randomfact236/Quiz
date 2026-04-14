'use client';

import { useEffect } from 'react';
import { UseFormReset } from 'react-hook-form';
import type { RiddleMcq } from '@/types/riddles';
import type { RiddleFormData } from './RiddleMcqModal';

const DEFAULT_VALUES: RiddleFormData = {
  question: '',
  level: 'easy',
  subjectId: '',
  options: ['', ''],
  correctLetter: 'A',
  hint: '',
  explanation: '',
  status: 'draft',
};

export function useRiddleFormReset(
  open: boolean,
  riddle: RiddleMcq | undefined,
  subjects: { id: string; categoryId?: string | null }[],
  setSelectedCategoryId: (id: string) => void,
  reset: UseFormReset<RiddleFormData>
) {
  useEffect(() => {
    if (!open) return;

    setSelectedCategoryId('');

    if (riddle) {
      const subject = subjects.find((s) => s.id === riddle.subjectId);
      const categoryId = subject?.categoryId || '';
      setSelectedCategoryId(categoryId);

      const levelOptions = riddle.level === 'expert' ? [] : riddle.options || ['', ''];

      reset({
        question: riddle.question,
        level: riddle.level as RiddleFormData['level'],
        subjectId: riddle.subjectId || '',
        options: levelOptions,
        correctLetter: riddle.correctLetter || 'A',
        answer: riddle.answer || '',
        hint: riddle.hint || '',
        explanation: riddle.explanation || '',
        status: riddle.status as RiddleFormData['status'],
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [open, riddle, subjects, reset, setSelectedCategoryId]);
}
