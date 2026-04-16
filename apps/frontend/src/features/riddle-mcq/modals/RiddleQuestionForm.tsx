'use client';

import type { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form';
import type { RiddleMcqSubject, RiddleMcqCategory } from '@/lib/riddle-mcq-api';
import type { RiddleFormData } from './RiddleMcqModal';

interface RiddleQuestionFormProps {
  register: UseFormRegister<RiddleFormData>;
  watch: UseFormWatch<RiddleFormData>;
  errors: FieldErrors<RiddleFormData>;
  categories: RiddleMcqCategory[];
  subjects: RiddleMcqSubject[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  onLevelChange: (level: string) => void;
}

const LEVEL_OPTIONS = [
  { value: 'easy', label: '🌱 Easy (2 options)' },
  { value: 'medium', label: '🌿 Medium (3 options)' },
  { value: 'hard', label: '🌲 Hard (4 options)' },
  { value: 'expert', label: '🔥 Expert (text answer)' },
];

export function RiddleQuestionForm({
  register,
  watch,
  errors,
  categories,
  subjects,
  selectedCategoryId,
  onCategoryChange,
  onLevelChange,
}: RiddleQuestionFormProps) {
  const currentLevel = watch('level');

  const filteredSubjects = selectedCategoryId
    ? subjects.filter((s) => s.categoryId === selectedCategoryId)
    : subjects;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            value={selectedCategoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
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
          onChange={(e) => onLevelChange(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          {LEVEL_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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
        {errors.question && <p className="text-xs text-red-500 mt-1">{errors.question.message}</p>}
      </div>
    </>
  );
}
