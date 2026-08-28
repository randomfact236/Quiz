/**
 * ============================================================================
 * CategoryModal — add/edit category modal
 * ============================================================================
 */

'use client';

import { X } from 'lucide-react';

export interface CategoryModalProps {
  isAdd: boolean;
  form: { name: string; emoji: string };
  onChange: (patch: { name?: string; emoji?: string }) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function CategoryModal({
  isAdd,
  form,
  onChange,
  onSubmit,
  onClose,
}: CategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">
            {isAdd ? 'Add New Category' : 'Edit Category'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Category Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => onChange({ name: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              placeholder="e.g. Brain Teasers"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">Emoji Icon</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.emoji}
                onChange={(e) => onChange({ emoji: e.target.value })}
                className="w-20 rounded-xl border border-gray-200 px-4 py-2.5 text-center text-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
              />
              <div className="flex-1 rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-500 flex items-center">
                Enter any emoji to represent this category.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!form.name.trim()}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 transition-all"
          >
            {isAdd ? 'Create Category' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
