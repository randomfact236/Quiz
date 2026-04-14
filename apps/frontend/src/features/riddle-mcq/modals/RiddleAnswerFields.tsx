'use client';

import type { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { RiddleFormData } from './RiddleMcqModal';

interface RiddleAnswerFieldsProps {
  register: UseFormRegister<RiddleFormData>;
  watch: UseFormWatch<RiddleFormData>;
  setValue: UseFormSetValue<RiddleFormData>;
  errors: FieldErrors<RiddleFormData>;
}

const LEVEL_OPTIONS = {
  easy: { optionCount: 2 },
  medium: { optionCount: 3 },
  hard: { optionCount: 4 },
  expert: { optionCount: 0 },
} as const;

const letters = ['A', 'B', 'C', 'D'];

export function RiddleAnswerFields({ register, watch, setValue, errors }: RiddleAnswerFieldsProps) {
  const currentLevel = watch('level');
  const currentCorrectLetter = watch('correctLetter');

  const isExpert = currentLevel === 'expert';
  const optionCount = LEVEL_OPTIONS[currentLevel as keyof typeof LEVEL_OPTIONS]?.optionCount || 2;

  const handleCorrectAnswerChange = (letter: string) => {
    setValue('correctLetter', letter);
  };

  if (isExpert) {
    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Answer (required)
        </label>
        <input
          {...register('answer')}
          placeholder="Type the correct answer"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {errors.answer && <p className="text-xs text-red-500 mt-1">{errors.answer.message}</p>}
      </div>
    );
  }

  return (
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
  );
}
