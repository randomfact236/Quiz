/**
 * ============================================================================
 * STATUS TYPES - Type definitions for status management
 * ============================================================================
 * @module types/status.types
 * @description Enterprise-grade type definitions for quiz/status management
 */

/**
 * Status filter options for filtering content
 */
export type StatusFilter = 'all' | 'published' | 'draft' | 'trash';

/**
 * Bulk action types for performing operations on multiple items
 */
export type BulkActionType = 'publish' | 'draft' | 'trash' | 'delete' | 'restore';

/**
 * Status count data structure
 */
export interface StatusCounts {
  /** Total number of items */
  total: number;
  /** Number of published items */
  published: number;
  /** Number of draft items */
  draft: number;
  /** Number of items in trash */
  trash: number;
}

/**
 * Result of a bulk action operation
 */
export interface BulkActionResult {
  /** Whether the operation was successful */
  success: boolean;
  /** Number of items affected */
  affectedCount: number;
  /** IDs of items that were successfully processed */
  processedIds: string[];
  /** IDs of items that failed to process */
  failedIds: string[];
  /** Error message if operation partially or fully failed */
  message?: string;
}

/**
 * API error response structure
 */
export interface ApiError {
  /** Error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * Toast notification types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast notification structure
 */
export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast message */
  message: string;
  /** Toast type */
  type: ToastType;
  /** Auto-dismiss duration in milliseconds */
  duration?: number;
}

/**
 * Status card configuration
 */
export interface StatusCardConfig {
  /** Unique key */
  key: StatusFilter;
  /** Display label */
  label: string;
  /** Color theme */
  color: 'blue' | 'green' | 'yellow' | 'red';
  /** Icon identifier */
  icon: string;
  /** ARIA label for accessibility */
  ariaLabel: string;
}

/**
 * Status configuration for UI display
 */
export const STATUS_CONFIG: Record<StatusFilter, StatusCardConfig> = {
  all: {
    key: 'all',
    label: 'Total',
    color: 'blue',
    icon: 'Layers',
    ariaLabel: 'Show all items',
  },
  published: {
    key: 'published',
    label: 'Published',
    color: 'green',
    icon: 'CheckCircle',
    ariaLabel: 'Show published items',
  },
  draft: {
    key: 'draft',
    label: 'Draft',
    color: 'yellow',
    icon: 'FileEdit',
    ariaLabel: 'Show draft items',
  },
  trash: {
    key: 'trash',
    label: 'Trash',
    color: 'red',
    icon: 'Trash2',
    ariaLabel: 'Show trashed items',
  },
} as const;

/**
 * Bulk action button configuration
 */
export interface BulkActionConfig {
  /** Action type */
  action: BulkActionType;
  /** Display label */
  label: string;
  /** Icon identifier */
  icon: string;
  /** Color variant */
  variant: 'primary' | 'secondary' | 'danger' | 'warning';
  /** Whether action requires confirmation */
  requiresConfirmation: boolean;
  /** Confirmation dialog title */
  confirmationTitle?: string;
  /** Confirmation dialog message */
  confirmationMessage?: string;
  /** Confirmation button text */
  confirmButtonText?: string;
  /** Filters where this action is available */
  availableInFilters: StatusFilter[];
}

/**
 * Bulk action configurations for UI display
 */
export const BULK_ACTIONS_CONFIG: Record<BulkActionType, BulkActionConfig> = {
  publish: {
    action: 'publish',
    label: 'Publish',
    icon: 'CheckCircle',
    variant: 'primary',
    requiresConfirmation: false,
    availableInFilters: ['all', 'draft', 'trash'],
  },
  draft: {
    action: 'draft',
    label: 'Move to Draft',
    icon: 'FileEdit',
    variant: 'secondary',
    requiresConfirmation: false,
    availableInFilters: ['all', 'published', 'trash'],
  },
  trash: {
    action: 'trash',
    label: 'Move to Trash',
    icon: 'Trash2',
    variant: 'warning',
    requiresConfirmation: true,
    confirmationTitle: 'Move to Trash',
    confirmationMessage: 'Are you sure you want to move the selected items to trash?',
    confirmButtonText: 'Move to Trash',
    availableInFilters: ['all', 'published', 'draft'],
  },
  delete: {
    action: 'delete',
    label: 'Delete Permanently',
    icon: 'AlertTriangle',
    variant: 'danger',
    requiresConfirmation: true,
    confirmationTitle: 'Delete Permanently',
    confirmationMessage: 'This action cannot be undone. The selected items will be permanently deleted.',
    confirmButtonText: 'Delete Permanently',
    availableInFilters: ['trash'],
  },
  restore: {
    action: 'restore',
    label: 'Restore',
    icon: 'RotateCcw',
    variant: 'primary',
    requiresConfirmation: false,
    availableInFilters: ['trash'],
  },
} as const;
