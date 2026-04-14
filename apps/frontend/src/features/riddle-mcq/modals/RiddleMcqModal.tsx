'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import type { RiddleSubject, RiddleCategory } from '@/lib/riddle-mcq-api';
import type { RiddleMcq } from '@/types/riddles';
import type { CreateRiddleMcqDto } from '@/lib/riddle-mcq-api';

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

type RiddleFormData = z.infer<typeof riddleSchema>;

interface RiddleMcqModalProps {
  open: boolean;
  riddle: RiddleMcq | undefined;
  subjects: RiddleSubject[];
  categories: RiddleCategory[];
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
  const currentCorrectLetter = watch('correctLetter');
  const currentStatus = watch('status');

  const filteredSubjects = selectedCategoryId
    ? subjects.filter((s) => s.categoryId === selectedCategoryId)
    : subjects;

  useEffect(() => {
    if (open) {
      setSelectedCategoryId('');
      if (riddle) {
        const subject = subjects.find((s) => s.id === riddle.subjectId);
        setSelectedCategoryId(subject?.categoryId || '');
        reset({
          question: riddle.question,
          level: riddle.level as RiddleFormData['level'],
          subjectId: riddle.subjectId || '',
          options: riddle.options || ['', ''],
          correctLetter: riddle.correctLetter || 'A',
          answer: riddle.answer || '',
          hint: riddle.hint || '',
          explanation: riddle.explanation || '',
          status: riddle.status as RiddleFormData['status'],
        });
      } else {
        reset({
          question: '',
          level: 'easy',
          subjectId: '',
          options: ['', ''],
          correctLetter: 'A',
          hint: '',
          explanation: '',
          status: 'draft',
        });
      }
    }
  }, [open, riddle, subjects, reset]);

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

  const handleCorrectAnswerChange = (letter: string) => {
    setValue('correctLetter', letter);
  };

  if (!open) return null;

  const isExpert = currentLevel === 'expert';
  const optionCount = LEVEL_OPTIONS[currentLevel as keyof typeof LEVEL_OPTIONS]?.optionCount || 2;

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

  const letters = ['A', 'B', 'C', 'D'];

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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setValue('subjectId', '');
                }}
              >
                <option value="">Select</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject
              </label>
              <select
                {...register('subjectId')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                disabled={!selectedCategoryId}
              >
                <option value="">Select</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-xs text-red-500 mt-1">{errors.subjectId.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level
            </label>
            <select
              value={currentLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="easy">🌱 Easy (2 options)</option>
              <option value="medium">🌿 Medium (3 options)</option>
              <option value="hard">🌲 Hard (4 options)</option>
              <option value="expert">🔥 Expert (text answer)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Question
            </label>
            <textarea
              {...register('question')}
              rows={2}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {errors.question && (
              <p className="text-xs text-red-500 mt-1">{errors.question.message}</p>
            )}
          </div>

          {!isExpert && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Options
              </label>
              <div className="grid grid-cols-2 gap-2">
                {letters.slice(0, optionCount).map((letter, i) => (
                  <div key={letter} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCorrectAnswerChange(letter)}
                      className={`flex items-center justify-center w-8 h-8 rounded border ${
                        currentCorrectLetter === letter
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 dark:border-gray-600 hover:border-green-400'
                      }`}
                    >
                      {currentCorrectLetter === letter ? '✓' : ''}
                    </button>
                    <span className="flex items-center justify-center w-6 h-8 bg-gray-100 dark:bg-gray-700 rounded text-sm font-medium">
                      {letter}
                    </span>
                    <input
                      {...register(`options.${i}`)}
                      placeholder={`Option ${letter}`}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                ))}
              </div>
              {errors.options && (
                <p className="text-xs text-red-500 mt-1">{errors.options.message as string}</p>
              )}
            </div>
          )}

          {isExpert && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Answer (required)
              </label>
              <input
                {...register('answer')}
                placeholder="Type the correct answer"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.answer && (
                <p className="text-xs text-red-500 mt-1">{errors.answer.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Hint <span className="text-gray-400">(optional)</span>
              </label>
              <input
                {...register('hint')}
                placeholder="Show hint before answering"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Explanation <span className="text-gray-400">(optional)</span>
              </label>
              <input
                {...register('explanation')}
                placeholder="Explain the answer"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setValue('status', 'draft')}
                className={`px-3 py-2 text-sm font-medium ${
                  currentStatus === 'draft'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Draft
              </button>
              <button
                type="button"
                onClick={() => setValue('status', 'published')}
                className={`px-3 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 ${
                  currentStatus === 'published'
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setValue('status', 'trash')}
                className={`px-3 py-2 text-sm font-medium border-l border-gray-300 dark:border-gray-600 ${
                  currentStatus === 'trash'
                    ? 'bg-red-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                Trash
              </button>
            </div>
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
