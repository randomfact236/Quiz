/**
 * ============================================================================
 * RiddleFormMetaFields — difficulty/timer/category/status form controls
 * ============================================================================
 */

'use client';

import type { ContentStatus } from '@/app/admin/types';

import type { RiddleFormState } from '../lib/form';
import type { AdminImageRiddleCategory } from '../hooks/useAdminImageRiddleData';

export interface RiddleFormMetaFieldsProps {
  form: RiddleFormState;
  onChange: (patch: Partial<RiddleFormState>) => void;
  categories: AdminImageRiddleCategory[];
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

export default function RiddleFormMetaFields({
  form,
  onChange,
  categories,
}: RiddleFormMetaFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="image-riddle-difficulty"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Difficulty <span aria-label="required">*</span>
          </label>
          <select
            id="image-riddle-difficulty"
            value={form.difficulty}
            onChange={(e) =>
              onChange({ difficulty: e.target.value as RiddleFormState['difficulty'] })
            }
            className={inputClass}
            aria-required="true"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="image-riddle-timer"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Timer (seconds)
          </label>
          <input
            id="image-riddle-timer"
            type="number"
            value={form.timerSeconds}
            onChange={(e) => onChange({ timerSeconds: e.target.value })}
            className={inputClass}
            placeholder="Leave empty for default (90s)"
            aria-describedby="timer-default"
          />
          <span id="timer-default" className="sr-only">
            Leave empty for default 90 seconds
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="image-riddle-category"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category Name <span aria-label="required">*</span>
          </label>
          <select
            id="image-riddle-category"
            value={form.categoryName}
            onChange={(e) => {
              const selectedName = e.target.value;
              const cat = categories.find((c) => c.name === selectedName);
              onChange({
                categoryName: selectedName,
                categoryEmoji: cat ? cat.emoji : form.categoryEmoji,
              });
            }}
            className={inputClass}
            aria-required="true"
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={`category-option-${cat.id}`} value={cat.name}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="image-riddle-emoji"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Category Emoji
          </label>
          <input
            id="image-riddle-emoji"
            type="text"
            value={form.categoryEmoji}
            onChange={(e) => onChange({ categoryEmoji: e.target.value })}
            className={inputClass}
            placeholder="e.g., 🔍"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 border-t border-slate-100 pt-4 mt-4">
        <div className="flex-1">
          <label
            htmlFor="image-riddle-status"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="image-riddle-status"
            value={form.status || 'draft'}
            onChange={(e) => onChange({ status: e.target.value as ContentStatus })}
            className={`${inputClass} bg-slate-50 font-bold`}
          >
            <option value="draft">Draft (Hidden)</option>
            <option value="published">Published (Live)</option>
            <option value="trash">Trash (Hidden)</option>
          </select>
        </div>

        <label className="flex items-center gap-2 mt-6 cursor-pointer">
          <input
            type="checkbox"
            checked={form.showTimer}
            onChange={(e) => onChange({ showTimer: e.target.checked })}
            className="rounded border-gray-300 w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-700 font-medium select-none">Show Timer</span>
        </label>
        <label className="flex items-center gap-2 mt-6 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => onChange({ isActive: e.target.checked })}
            className="rounded border-gray-300 w-4 h-4 text-blue-600"
          />
          <span className="text-sm text-gray-700 font-medium select-none">Active</span>
        </label>
      </div>
    </>
  );
}
