import { cn } from '@/lib/utils';

interface ModalFooterProps {
  onCancel: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  isSaving?: boolean;
  variant?: 'primary' | 'danger';
  showSave?: boolean;
}

export function ModalFooter({
  onCancel,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  isSaving = false,
  variant = 'primary',
  showSave = true,
}: ModalFooterProps): JSX.Element {
  return (
    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {cancelLabel}
      </button>
      {showSave && (
        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50',
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-blue-500 hover:bg-blue-600'
          )}
        >
          {isSaving ? 'Saving...' : saveLabel}
        </button>
      )}
    </div>
  );
}
