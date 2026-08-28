/**
 * ============================================================================
 * RiddleFormModal — add/edit modal shell wrapping RiddleFormFields
 * ============================================================================
 */

'use client';

import type { ImageRiddle } from '@/app/admin/types';

import type { RiddleFormState } from '../lib/form';
import { isRiddleFormComplete } from '../lib/form';
import type { AdminImageRiddleCategory } from '../hooks/useAdminImageRiddleData';
import RiddleFormFields from './RiddleFormFields';

export interface RiddleFormModalProps {
  isAdd: boolean;
  form: RiddleFormState;
  selectedRiddle: ImageRiddle | null;
  categories: AdminImageRiddleCategory[];
  isSaving: boolean;
  modalRef: React.RefObject<HTMLDivElement>;
  onChange: (patch: Partial<RiddleFormState>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onOpenMediaPicker: () => void;
}

export default function RiddleFormModal({
  isAdd,
  form,
  categories,
  isSaving,
  modalRef,
  onChange,
  onSubmit,
  onCancel,
  onOpenMediaPicker,
}: RiddleFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6"
      >
        <h3 className="mb-4 text-xl font-bold">
          {isAdd ? '➕ Add New Image Riddle' : '✏️ Edit Image Riddle'}
        </h3>

        <RiddleFormFields
          form={form}
          onChange={onChange}
          categories={categories}
          onOpenMediaPicker={onOpenMediaPicker}
        />

        <div className="flex gap-2 pt-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSaving || !isRiddleFormComplete(form)}
            className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : isAdd ? 'Add Riddle' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
