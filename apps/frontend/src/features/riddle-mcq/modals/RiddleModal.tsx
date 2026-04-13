'use client';

import { useEffect } from 'react';
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

interface RiddleModalProps {
  open: boolean;
  riddle: RiddleMcq | undefined;
  subjects: RiddleSubject[];
  categories: RiddleCategory[];
  onClose: () => void;
  onSubmit: (dto: CreateRiddleMcqDto) => void;
  isSubmitting?: boolean;
}

export function RiddleModal({
  open,
  riddle,
  subjects,
  categories,
  onClose,
  onSubmit,
  isSubmitting = false,
}: RiddleModalProps) {
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
  const currentSubjectId = watch('subjectId');

  const currentSubject = subjects.find((s) => s.id === currentSubjectId);
  const subjectCategoryId = currentSubject?.categoryId;

  useEffect(() => {
    if (open) {
      if (riddle) {
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
  }, [open, riddle, reset]);

  const handleLevelChange = (newLevel: string) => {
    setValue('level', newLevel as RiddleFormData['level']);
    if (newLevel === 'expert') {
      setValue('options', []);
      setValue('correctLetter', undefined);
    } else {
      const optionCount = LEVEL_OPTIONS[newLevel as keyof typeof LEVEL_OPTIONS]?.optionCount || 2;
      const currentOptions = getValues('options') || [];
      setValue('options', currentOptions.slice(0, optionCount));
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

  const filteredSubjects = subjectCategoryId
    ? subjects.filter((s) => s.categoryId === subjectCategoryId)
    : subjects;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{riddle ? 'Edit Riddle' : 'Add Riddle'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Category</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2"
                value={subjectCategoryId || ''}
                onChange={() => {
                  setValue('subjectId', '');
                }}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Subject</label>
              <select
                {...register('subjectId')}
                className="w-full rounded-lg border border-gray-300 p-2"
                disabled={!subjectCategoryId && !currentSubjectId}
              >
                <option value="">Select Subject</option>
                {filteredSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.emoji} {s.name}
                  </option>
                ))}
              </select>
              {errors.subjectId && (
                <p className="text-sm text-red-500">{errors.subjectId.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Level</label>
            <select
              value={currentLevel}
              onChange={(e) => handleLevelChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="easy">🌱 Easy (2 options)</option>
              <option value="medium">🌿 Medium (3 options)</option>
              <option value="hard">🌲 Hard (4 options)</option>
              <option value="expert">🔥 Expert (text answer)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Question</label>
            <textarea
              {...register('question')}
              rows={3}
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.question && <p className="text-sm text-red-500">{errors.question.message}</p>}
          </div>

          {!isExpert && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Options</label>
              {Array.from({ length: optionCount }).map((_, i) => (
                <div key={i} className="flex gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    {...register(`options.${i}`)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 rounded-lg border border-gray-300 p-2"
                  />
                </div>
              ))}
              {errors.options && (
                <p className="text-sm text-red-500">{errors.options.message as string}</p>
              )}
            </div>
          )}

          {!isExpert && (
            <div>
              <label className="mb-1 block text-sm font-medium">Correct Answer</label>
              <select
                {...register('correctLetter')}
                className="w-full rounded-lg border border-gray-300 p-2"
              >
                {LEVEL_OPTIONS[currentLevel as keyof typeof LEVEL_OPTIONS]?.validLetters.map(
                  (letter) => (
                    <option key={letter} value={letter}>
                      {letter}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {isExpert && (
            <div>
              <label className="mb-1 block text-sm font-medium">Answer (required)</label>
              <input
                {...register('answer')}
                placeholder="Type the correct answer"
                className="w-full rounded-lg border border-gray-300 p-2"
              />
              {errors.answer && <p className="text-sm text-red-500">{errors.answer.message}</p>}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">
              Hint <span className="text-gray-400">(optional, max 500)</span>
            </label>
            <input
              {...register('hint')}
              placeholder="Show hint before answering"
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.hint && <p className="text-sm text-red-500">{errors.hint.message}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Explanation <span className="text-gray-400">(optional, max 2000)</span>
            </label>
            <textarea
              {...register('explanation')}
              rows={2}
              placeholder="Explain the answer after answering"
              className="w-full rounded-lg border border-gray-300 p-2"
            />
            {errors.explanation && (
              <p className="text-sm text-red-500">{errors.explanation.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              {...register('status')}
              className="w-full rounded-lg border border-gray-300 p-2"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="trash">Trash</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : riddle ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RiddleModal;
