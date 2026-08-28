/**
 * ============================================================================
 * AdminConfirmModals — trash, delete-category, and reload confirmations
 * ============================================================================
 */

'use client';

import { RefreshCw, Trash2 } from 'lucide-react';

import type { ImageRiddle } from '@/app/admin/types';

// ============================================================================
// Trash / permanent-delete confirmation
// ============================================================================

export function TrashConfirmModal({
  riddle,
  onCancel,
  onConfirm,
}: {
  riddle: ImageRiddle;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
        <h3 className="mb-2 text-xl font-bold flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-500" />
          {riddle.status === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
        </h3>
        <p className="mb-4 text-gray-600">
          {riddle.status === 'trash'
            ? 'Are you sure you want to permanently delete this image riddle? This action cannot be undone.'
            : 'Are you sure you want to move this image riddle to trash? You can still restore it later from the Trash tab.'}
        </p>
        <div className="mb-6 rounded-lg bg-gray-50 p-3 border border-gray-100">
          <p className="line-clamp-2 text-sm font-medium text-gray-800">{riddle.title}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-600 transition-shadow hover:shadow-lg active:scale-95 transition-transform"
          >
            {riddle.status === 'trash' ? 'Permanently Delete' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Delete category confirmation
// ============================================================================

export function DeleteCategoryConfirmModal({
  categoryName,
  onCancel,
  onConfirm,
}: {
  categoryName: string | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <Trash2 className="h-6 w-6" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900 text-left px-0">Delete Category?</h3>
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to delete{' '}
          <span className="font-bold text-gray-900">&quot;{categoryName}&quot;</span>? Riddles
          currently in this category will be archived (moved out of the active list).
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Keep it
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-500/25 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Reload-from-server confirmation
// ============================================================================

export function SyncConfirmModal({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
          <RefreshCw className="h-6 w-6" aria-hidden="true" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900 text-left px-0">Reload from Server?</h3>
        <p className="mb-6 text-sm text-gray-600">
          This will discard local edits and re-fetch all riddles and categories from the database.
          Unsaved changes will be lost.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
