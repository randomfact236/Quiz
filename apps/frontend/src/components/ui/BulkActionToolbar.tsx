/**
 * ============================================================================
 * BULK ACTION TOOLBAR COMPONENT
 * ============================================================================
 * @module components/ui/BulkActionToolbar
 * @description Enterprise-grade toolbar for bulk item operations
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  FileEdit,
  Trash2,
  AlertTriangle,
  RotateCcw,
  X,
  CheckSquare,
  Square,
  Loader2,
  XCircle,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';
import type {
  BulkActionType,
  StatusFilter,
  BulkActionConfig,
} from '@/types/status.types';
import { BULK_ACTIONS_CONFIG } from '@/types/status.types';

/**
 * Props for the BulkActionToolbar component
 */
export interface BulkActionToolbarProps {
  /** Array of selected item IDs */
  selectedIds: string[];
  /** Total number of items available */
  totalItems: number;
  /** Current filter context */
  currentFilter: StatusFilter;
  /** Callback to select all items */
  onSelectAll: () => void;
  /** Callback to deselect all items */
  onDeselectAll: () => void;
  /** Callback when an action is executed */
  onAction: (action: BulkActionType) => Promise<void>;
  /** Callback to close/dismiss the toolbar */
  onClose: () => void;
  /** Loading state during action execution */
  loading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Confirmation modal props
 */
interface ConfirmationModalProps {
  isOpen: boolean;
  config: BulkActionConfig;
  itemCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Icon mapping for bulk actions
 */
const ACTION_ICONS = {
  CheckCircle,
  FileEdit,
  Trash2,
  AlertTriangle,
  RotateCcw,
} as const;

/**
 * Confirmation Modal Component
 */
const ConfirmationModal = React.memo(function ConfirmationModal({
  isOpen,
  config,
  itemCount,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmationModalProps): JSX.Element | null {
  if (!isOpen) {return null;}

  const Icon = ACTION_ICONS[config.icon as keyof typeof ACTION_ICONS];
  const itemText = itemCount === 1 ? 'item' : 'items';

  const isDestructive = config.action === 'delete';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={!isLoading ? onCancel : undefined}
            aria-hidden="true"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                'w-full max-w-md rounded-2xl shadow-xl',
                'bg-white dark:bg-secondary-900',
                'border border-secondary-200 dark:border-secondary-700',
                'pointer-events-auto'
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-title"
              aria-describedby="confirm-description"
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-center gap-3 p-6 border-b',
                  'border-secondary-100 dark:border-secondary-800'
                )}
              >
                <div
                  className={cn(
                    'p-2 rounded-full',
                    isDestructive
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isDestructive
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-amber-600 dark:text-amber-400'
                    )}
                  />
                </div>
                <h2
                  id="confirm-title"
                  className="text-lg font-semibold text-secondary-900 dark:text-secondary-100"
                >
                  {config.confirmationTitle}
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                <p
                  id="confirm-description"
                  className="text-secondary-600 dark:text-secondary-400"
                >
                  {config.confirmationMessage}
                </p>
                <div
                  className={cn(
                    'mt-4 p-3 rounded-lg',
                    'bg-secondary-50 dark:bg-secondary-800/50',
                    'border border-secondary-200 dark:border-secondary-700'
                  )}
                >
                  <span className="text-sm text-secondary-600 dark:text-secondary-400">
                    Selected:{' '}
                    <strong className="text-secondary-900 dark:text-secondary-100">
                      {itemCount} {itemText}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div
                className={cn(
                  'flex justify-end gap-3 p-6 pt-0',
                  'sm:flex-row flex-col-reverse'
                )}
              >
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm',
                    'text-secondary-700 dark:text-secondary-300',
                    'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                    'focus:outline-none focus:ring-2 focus:ring-secondary-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm',
                    'flex items-center justify-center gap-2',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2',
                    'dark:focus:ring-offset-secondary-900',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-200',
                    isDestructive
                      ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                      : 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
                  )}
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {config.confirmButtonText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
});

/**
 * Action Button Component
 */
interface ActionButtonProps {
  config: BulkActionConfig;
  onClick: () => void;
  isLoading: boolean;
}

const ActionButton = React.memo(function ActionButton({
  config,
  onClick,
  isLoading,
}: ActionButtonProps): JSX.Element {
  const Icon = ACTION_ICONS[config.icon as keyof typeof ACTION_ICONS];

  const variantStyles = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary:
      'bg-secondary-100 text-secondary-700 hover:bg-secondary-200 focus:ring-secondary-500 dark:bg-secondary-800 dark:text-secondary-200 dark:hover:bg-secondary-700',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning:
      'bg-amber-100 text-amber-700 hover:bg-amber-200 focus:ring-amber-500 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
        'font-medium text-sm',
        'focus:outline-none focus:ring-2 focus:ring-offset-1',
        'dark:focus:ring-offset-secondary-800',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-all duration-200',
        'whitespace-nowrap',
        variantStyles[config.variant]
      )}
      title={config.label}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span className="hidden sm:inline">{config.label}</span>
    </button>
  );
});

/**
 * BulkActionToolbar - Main toolbar component
 */
export const BulkActionToolbar = React.memo(function BulkActionToolbar({
  selectedIds,
  totalItems,
  currentFilter,
  onSelectAll,
  onDeselectAll,
  onAction,
  onClose,
  loading = false,
  className = '',
}: BulkActionToolbarProps): JSX.Element | null {
  const [confirmAction, setConfirmAction] = useState<BulkActionType | null>(null);

  const selectedCount = selectedIds.length;
  const isAllSelected = selectedCount === totalItems && totalItems > 0;

  /**
   * Get available actions for current filter
   */
  const availableActions = useMemo(() => {
    return (Object.keys(BULK_ACTIONS_CONFIG) as BulkActionType[]).filter(
      (action) =>
        BULK_ACTIONS_CONFIG[action].availableInFilters.includes(currentFilter)
    );
  }, [currentFilter]);

  /**
   * Handle action button click
   */
  const handleActionClick = useCallback(
    (action: BulkActionType) => {
      const config = BULK_ACTIONS_CONFIG[action];

      if (config.requiresConfirmation) {
        setConfirmAction(action);
      } else {
        onAction(action);
      }
    },
    [onAction]
  );

  /**
   * Handle confirmation
   */
  const handleConfirm = useCallback(async () => {
    if (confirmAction) {
      await onAction(confirmAction);
      setConfirmAction(null);
    }
  }, [confirmAction, onAction]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    setConfirmAction(null);
  }, []);

  /**
   * Toggle select all/none
   */
  const handleSelectAllToggle = useCallback(() => {
    if (isAllSelected) {
      onDeselectAll();
    } else {
      onSelectAll();
    }
  }, [isAllSelected, onSelectAll, onDeselectAll]);

  // Don't render if nothing is selected
  if (selectedCount === 0) {
    return null;
  }

  const itemText = selectedCount === 1 ? 'item selected' : 'items selected';

  return (
    <>
      {/* Confirmation Modal */}
      {confirmAction && (
        <ConfirmationModal
          isOpen={!!confirmAction}
          config={BULK_ACTIONS_CONFIG[confirmAction]}
          itemCount={selectedCount}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          isLoading={loading}
        />
      )}

      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed bottom-4 left-4 right-4 sm:static',
          'z-40 sm:z-auto',
          className
        )}
      >
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4',
            'p-4 rounded-xl sm:rounded-lg',
            'bg-white dark:bg-secondary-900',
            'border border-secondary-200 dark:border-secondary-700',
            'shadow-lg sm:shadow-soft',
            'max-w-none sm:max-w-full',
            'mx-auto'
          )}
          role="toolbar"
          aria-label="Bulk actions toolbar"
        >
          {/* Selection Info */}
          <div className="flex items-center justify-between sm:justify-start gap-4 min-w-fit">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30">
                <CheckSquare className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-secondary-900 dark:text-secondary-100">
                  {selectedCount}
                </span>
                <span className="text-xs text-secondary-500 dark:text-secondary-400">
                  {itemText}
                </span>
              </div>
            </div>

            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className={cn(
                'sm:hidden p-2 rounded-lg',
                'text-secondary-500 hover:text-secondary-700',
                'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                'transition-colors duration-200'
              )}
              aria-label="Close toolbar"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-secondary-200 dark:bg-secondary-700" />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {availableActions.map((action) => (
              <ActionButton
                key={action}
                config={BULK_ACTIONS_CONFIG[action]}
                onClick={() => handleActionClick(action)}
                isLoading={loading}
              />
            ))}
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-8 bg-secondary-200 dark:bg-secondary-700" />

          {/* Selection Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllToggle}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
                'font-medium text-sm',
                'text-secondary-700 dark:text-secondary-300',
                'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                'focus:outline-none focus:ring-2 focus:ring-secondary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200',
                'whitespace-nowrap'
              )}
            >
              {isAllSelected ? (
                <>
                  <Square className="w-4 h-4" />
                  <span className="hidden sm:inline">Deselect All</span>
                  <span className="sm:hidden">None</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Select All</span>
                  <span className="sm:hidden">All</span>
                </>
              )}
            </button>

            {/* Close button (desktop) */}
            <button
              onClick={onClose}
              disabled={loading}
              className={cn(
                'hidden sm:inline-flex p-2 rounded-lg',
                'text-secondary-400 hover:text-secondary-600',
                'hover:bg-secondary-100 dark:hover:bg-secondary-800',
                'focus:outline-none focus:ring-2 focus:ring-secondary-500',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-colors duration-200'
              )}
              aria-label="Close toolbar"
              title="Close toolbar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
});

BulkActionToolbar.displayName = 'BulkActionToolbar';

export default BulkActionToolbar;
