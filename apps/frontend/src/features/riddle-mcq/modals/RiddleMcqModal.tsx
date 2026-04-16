'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { RiddleMcqSubject, RiddleMcqCategory } from '@/lib/riddle-mcq-api';
import type { RiddleMcq } from '@/types/riddles';
import type { CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';

import { RiddleQuestionForm } from './RiddleQuestionForm';
import { RiddleAnswerFields } from './RiddleAnswerFields';
import { RiddleMetaFields } from './RiddleMetaFields';
import { useRiddleFormReset } from './useRiddleFormReset';

const LEVEL_OPTIONS = {
  easy: { optionCount: 2, validLetters: ['A', 'B'] },
  medium: { optionCount: 3, validLetters: ['A', 'B', 'C'] },
  hard: { optionCount: 4, validLetters: ['A', 'B', 'C', 'D'] },
  expert: { optionCount: 0, validLetters: [] },
} as const;

const riddleSchema = z
  .object({
    question: z.string().min(1, 'Question is required').max(1000),
    level: z.enum(['easy', 'medium', 'hard', 'expert']),
    subjectId: z.string().min(1, 'Subject is required'),
    options: z.array(z.string()).optional(),
    correctLetter: z.string().optional(),
    answer: z.string().optional(),
    hint: z.string().max(500).optional(),
    explanation: z.string().max(2000).optional(),
    status: z.enum(['draft', 'published', 'trash']).optional(),
  })
  .refine(
    (data) => {
      if (data.level === 'expert') {
        return !!data.answer && data.answer.trim().length > 0;
      }
      const required = LEVEL_OPTIONS[data.level]?.optionCount || 0;
      return (data.options?.length || 0) >= required;
    },
    {
      message: 'Invalid options for level',
    }
  );

export type RiddleFormData = z.infer<typeof riddleSchema>;

interface RiddleMcqModalProps {
  open: boolean;
  riddle: RiddleMcq | undefined;
  subjects: RiddleMcqSubject[];
  categories: RiddleMcqCategory[];
  onClose: () => void;
  onSubmit: (dto: CreateRiddleMcqDto) => void;
  isSubmitting?: boolean;
}

export function RiddleMcqModal({
  open,
  riddle,
  subjects,
  categories,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RiddleMcqModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<RiddleFormData>({
    resolver: zodResolver(riddleSchema),
    defaultValues: {
      question: '',
      level: 'easy',
      subjectId: '',
      options: ['', ''],
      correctLetter: 'A',
      hint: '',
      explanation: '',
      status: 'draft',
    },
  });

  const currentLevel = watch('level');

  useRiddleFormReset(open, riddle, subjects, setSelectedCategoryId, reset);

  const handleLevelChange = (newLevel: string) => {
    const optionCount = LEVEL_OPTIONS[newLevel as keyof typeof LEVEL_OPTIONS]?.optionCount || 2;

    if (newLevel === 'expert') {
      setValue('level', 'expert');
      setValue('options', []);
      setValue('correctLetter', undefined);
    } else {
      setValue('level', newLevel as RiddleFormData['level']);
      const currentOptions = (getValues('options') || []).slice(0, optionCount);
      while (currentOptions.length < optionCount) {
        currentOptions.push('');
      }
      setValue('options', currentOptions);
      const letter = getValues('correctLetter');
      const validLetters = LEVEL_OPTIONS[newLevel as keyof typeof LEVEL_OPTIONS]?.validLetters || [
        'A',
        'B',
      ];
      if (letter && !(validLetters as readonly string[]).includes(letter)) {
        setValue('correctLetter', validLetters[0]);
      }
    }
  };

  if (!open) return null;

  const isExpert = currentLevel === 'expert';

  const handleFormSubmit = (data: RiddleFormData) => {
    const dto: CreateRiddleMcqDto = {
      question: data.question,
      level: data.level,
      subjectId: data.subjectId,
      status: data.status || 'draft',
    };

    if (isExpert) {
      if (data.answer) dto.answer = data.answer;
    } else {
      dto.options = data.options?.filter((o) => o.trim() !== '') || [];
      if (data.correctLetter) dto.correctLetter = data.correctLetter;
    }

    if (data.hint) dto.hint = data.hint;
    if (data.explanation) dto.explanation = data.explanation;

    onSubmit(dto);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setValue('subjectId', '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-hidden">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-6 shadow-xl overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{riddle ? 'Edit Riddle' : 'Add Riddle'}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
          <RiddleQuestionForm
            register={register}
            watch={watch}
            errors={errors}
            categories={categories}
            subjects={subjects}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={handleCategoryChange}
            onLevelChange={handleLevelChange}
          />

          <RiddleAnswerFields
            register={register}
            watch={watch}
            setValue={setValue}
            errors={errors}
          />

          <RiddleMetaFields register={register} watch={watch} setValue={setValue} />

          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : riddle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RiddleMcqModal;
