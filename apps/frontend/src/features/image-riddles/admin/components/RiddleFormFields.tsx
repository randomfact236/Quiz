/**
 * ============================================================================
 * RiddleFormFields — add/edit riddle form inputs (basics)
 * ============================================================================
 * Text inputs for title/image/answer/hint; meta controls (difficulty,
 * timer, category, status, flags) live in RiddleFormMetaFields.
 * ============================================================================
 */

'use client';

import Image from 'next/image';

import type { RiddleFormState } from '../lib/form';
import type { AdminImageRiddleCategory } from '../hooks/useAdminImageRiddleData';
import RiddleFormMetaFields from './RiddleFormMetaFields';

export interface RiddleFormFieldsProps {
  form: RiddleFormState;
  onChange: (patch: Partial<RiddleFormState>) => void;
  categories: AdminImageRiddleCategory[];
  onOpenMediaPicker: () => void;
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200';

export default function RiddleFormFields({
  form,
  onChange,
  categories,
  onOpenMediaPicker,
}: RiddleFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="image-riddle-title"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Title <span aria-label="required">*</span>
        </label>
        <input
          id="image-riddle-title"
          type="text"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className={inputClass}
          placeholder="Enter the riddle title..."
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="image-riddle-url" className="mb-1 block text-sm font-medium text-gray-700">
          Image URL <span aria-label="required">*</span>
        </label>
        <div className="flex gap-2">
          <input
            id="image-riddle-url"
            type="text"
            value={form.imageUrl}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            className={inputClass}
            placeholder="https://example.com/image.jpg or pick from library"
            aria-required="true"
          />
          <button
            type="button"
            onClick={onOpenMediaPicker}
            className="whitespace-nowrap rounded-lg bg-indigo-500 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-indigo-600"
            aria-label="Choose image from media library"
          >
            🖼️ Library
          </button>
        </div>
        {form.imageUrl && (
          <div className="mt-2 text-center rounded-lg border border-slate-200 bg-slate-50 p-2 overflow-hidden">
            <div className="relative h-36 w-full">
              <Image
                src={form.imageUrl}
                alt="Preview"
                fill
                sizes="576px"
                className="object-contain rounded"
                onError={(e) => {
                  (e.target as HTMLImageElement).alt = '❌ Invalid Image URL';
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <label
          htmlFor="image-riddle-answer"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Answer <span aria-label="required">*</span>
        </label>
        <input
          id="image-riddle-answer"
          type="text"
          value={form.answer}
          onChange={(e) => onChange({ answer: e.target.value })}
          className={inputClass}
          placeholder="Enter the answer..."
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="image-riddle-hint" className="mb-1 block text-sm font-medium text-gray-700">
          Hint
        </label>
        <input
          id="image-riddle-hint"
          type="text"
          value={form.hint}
          onChange={(e) => onChange({ hint: e.target.value })}
          className={inputClass}
          placeholder="Enter a hint (optional)..."
          aria-describedby="hint-optional"
        />
        <span id="hint-optional" className="sr-only">
          This field is optional
        </span>
      </div>

      <RiddleFormMetaFields form={form} onChange={onChange} categories={categories} />
    </div>
  );
}
