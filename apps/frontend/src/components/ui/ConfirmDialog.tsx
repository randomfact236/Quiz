'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger',
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const confirmButtonClass = {
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    default: 'bg-blue-500 hover:bg-blue-600 text-white',
  }[confirmVariant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-full',
            confirmVariant === 'danger' && 'bg-red-100 text-red-600',
            confirmVariant === 'warning' && 'bg-yellow-100 text-yellow-600',
            confirmVariant === 'default' && 'bg-blue-100 text-blue-600'
          )}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-gray-600 pt-1">{message}</p>
        </div>
        
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={cn(
              'px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors',
              confirmButtonClass
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;