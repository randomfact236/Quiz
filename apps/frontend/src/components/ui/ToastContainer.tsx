/**
 * ============================================================================
 * TOAST CONTAINER COMPONENT
 * ============================================================================
 * @module components/ui/ToastContainer
 * @description Toast notification container for displaying feedback
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { toastManager } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { Toast, ToastType } from '@/types/status.types';

/**
 * Toast item props
 */
interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

/**
 * Icon mapping for toast types
 */
const TOAST_ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

/**
 * Color configuration for toast types
 */
const TOAST_STYLES: Record<ToastType, string> = {
  success:
    'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-100',
  error:
    'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-100',
  warning:
    'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100',
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100',
};

/**
 * Icon color configuration for toast types
 */
const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-500 dark:text-green-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
};

/**
 * Individual Toast Item Component
 */
const ToastItem = React.memo(function ToastItem({
  toast,
  onDismiss,
}: ToastItemProps): JSX.Element {
  const Icon = TOAST_ICONS[toast.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'min-w-[300px] max-w-[500px]',
        TOAST_STYLES[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', ICON_STYLES[toast.type])} />
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className={cn(
          'flex-shrink-0 -mt-1 -mr-1 p-1 rounded',
          'opacity-60 hover:opacity-100',
          'transition-opacity duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current'
        )}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
});

/**
 * ToastContainer Props
 */
export interface ToastContainerProps {
  /** Position of the toast container */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  /** Additional CSS classes */
  className?: string;
}

/**
 * ToastContainer - Renders toast notifications
 */
export const ToastContainer = React.memo(function ToastContainer({
  position = 'bottom-right',
  className = '',
}: ToastContainerProps): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toastManager.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const handleDismiss = (id: string) => {
    toastManager.dismiss(id);
  };

  return (
    <div
      className={cn(
        'fixed z-[100] flex flex-col gap-2',
        positionStyles[position],
        className
      )}
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';

export default ToastContainer;
