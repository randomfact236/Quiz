'use client';

import type { UseFormRegister, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import type { RiddleFormData } from './RiddleMcqModal';

interface RiddleMetaFieldsProps {
  register: UseFormRegister<RiddleFormData>;
  watch: UseFormWatch<RiddleFormData>;
  setValue: UseFormSetValue<RiddleFormData>;
}

export function RiddleMetaFields({ register, watch, setValue }: RiddleMetaFieldsProps) {
  const currentStatus = watch('status');

  return (
    <>
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
      </div>
    </>
  );
}
