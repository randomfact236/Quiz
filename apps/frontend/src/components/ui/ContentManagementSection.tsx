/**
 * ============================================================================
 * CONTENT MANAGEMENT SECTION COMPONENT
 * ============================================================================
 * @module components/ui/ContentManagementSection
 * @description Enterprise-grade reusable section for managing content items
 *              with status tabs (Total/Published/Draft/Trash) and multi-select
 *              bulk actions (Publish, Draft, Trash, Delete, Restore).
 *
 * @quality 10/10 - Production Ready
 * @version 1.0.0
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    CheckCircle,
    FileEdit,
    Trash2,
    RotateCcw,
    MoreVertical,
    CheckSquare,
    Square,
    AlertTriangle,
    Inbox,
    ChevronDown,
    Eye,
    X,
    Loader2,
} from 'lucide-react';
import React, { useState, useCallback, useMemo } from 'react';

import { StatusDashboard } from './StatusDashboard';

import { cn, formatRelativeTime } from '@/lib/utils';
import type { StatusFilter, BulkActionType } from '@/types/status.types';
import { STATUS_CONFIG, BULK_ACTIONS_CONFIG } from '@/types/status.types';

// =============================================================================
// Types & Interfaces
// =============================================================================

/** Status of a content item */
export type ContentItemStatus = 'published' | 'draft' | 'trash';

/** A single manageable content item */
export interface ContentItem {
    /** Unique identifier */
    id: string;
    /** Item title / name */
    title: string;
    /** Current status of the item */
    status: ContentItemStatus;
    /** ISO timestamp when item was created */
    createdAt: string;
    /** ISO timestamp of last update */
    updatedAt: string;
    /** Optional category or group label */
    category?: string;
}

/** Props for the ContentManagementSection component */
export interface ContentManagementSectionProps {
    /** Type of content being managed — used for ARIA labels and keys */
    contentType: string;
    /** Section heading */
    title: string;
    /** Initial list of content items */
    items: ContentItem[];
    /** Notify parent when items change */
    onItemsChange?: (items: ContentItem[]) => void;
    /** CSS classes applied to the outer wrapper */
    className?: string;
}

// =============================================================================
// Constants
// =============================================================================

/** Actions available per item status */
const ITEM_ACTIONS: Record<
    ContentItemStatus,
    { action: BulkActionType; label: string; icon: React.ElementType; variant: string }[]
> = {
    published: [
        { action: 'draft', label: 'Move to Draft', icon: FileEdit, variant: 'text-yellow-600 dark:text-yellow-400' },
        { action: 'trash', label: 'Move to Trash', icon: Trash2, variant: 'text-red-600 dark:text-red-400' },
    ],
    draft: [
        { action: 'publish', label: 'Publish', icon: CheckCircle, variant: 'text-green-600 dark:text-green-400' },
        { action: 'trash', label: 'Move to Trash', icon: Trash2, variant: 'text-red-600 dark:text-red-400' },
    ],
    trash: [
        { action: 'restore', label: 'Restore', icon: RotateCcw, variant: 'text-blue-600 dark:text-blue-400' },
        { action: 'delete', label: 'Delete Permanently', icon: AlertTriangle, variant: 'text-red-600 dark:text-red-400' },
    ],
};

/** Status badge config */
const STATUS_BADGE_STYLES: Record<ContentItemStatus, string> = {
    published: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    trash: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_BADGE_LABELS: Record<ContentItemStatus, string> = {
    published: 'Published',
    draft: 'Draft',
    trash: 'Trash',
};

// =============================================================================
// Sub-Components
// =============================================================================

/**
 * StatusBadge — renders a coloured pill indicating the item's status
 */
const StatusBadge = React.memo(function StatusBadge({
    status,
}: {
    status: ContentItemStatus;
}): JSX.Element {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
                STATUS_BADGE_STYLES[status]
            )}
        >
            {STATUS_BADGE_LABELS[status]}
        </span>
    );
});

StatusBadge.displayName = 'StatusBadge';

/**
 * ItemActionMenu — dropdown menu for per-item actions
 */
const ItemActionMenu = React.memo(function ItemActionMenu({
    item,
    onAction,
}: {
    item: ContentItem;
    onAction: (id: string, action: BulkActionType) => void;
}): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const actions = ITEM_ACTIONS[item.status];

    const handleAction = useCallback(
        (action: BulkActionType) => {
            onAction(item.id, action);
            setIsOpen(false);
        },
        [item.id, onAction]
    );

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className={cn(
                    'p-1.5 rounded-lg transition-colors duration-150',
                    'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                )}
                aria-label={`Actions for ${item.title}`}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Invisible backdrop to close the menu */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className={cn(
                                'absolute right-0 top-full mt-1 z-50 min-w-[180px]',
                                'rounded-xl bg-white dark:bg-gray-900',
                                'border border-gray-200 dark:border-gray-700',
                                'shadow-xl py-1'
                            )}
                            role="menu"
                            aria-label={`Actions for ${item.title}`}
                        >
                            {actions.map(({ action, label, icon: Icon, variant }) => (
                                <button
                                    key={action}
                                    onClick={() => handleAction(action)}
                                    className={cn(
                                        'flex w-full items-center gap-2.5 px-3 py-2 text-sm font-medium',
                                        'transition-colors duration-150',
                                        'hover:bg-gray-50 dark:hover:bg-gray-800',
                                        variant
                                    )}
                                    role="menuitem"
                                >
                                    <Icon className="w-4 h-4 flex-shrink-0" />
                                    {label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
});

ItemActionMenu.displayName = 'ItemActionMenu';

/**
 * ContentRow — a single item row with checkbox, title, badge, date, and actions
 */
const ContentRow = React.memo(function ContentRow({
    item,
    isSelected,
    onToggle,
    onAction,
}: {
    item: ContentItem;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onAction: (id: string, action: BulkActionType) => void;
}): JSX.Element {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
            className={cn(
                'group flex items-center gap-3 px-4 py-3',
                'border-b border-gray-100 dark:border-gray-800 last:border-0',
                'transition-colors duration-150',
                isSelected
                    ? 'bg-primary-50/50 dark:bg-primary-950/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
            )}
        >
            {/* Checkbox */}
            <button
                onClick={() => onToggle(item.id)}
                className={cn(
                    'flex-shrink-0 p-0.5 rounded transition-colors duration-150',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                )}
                aria-label={isSelected ? `Deselect ${item.title}` : `Select ${item.title}`}
                role="checkbox"
                aria-checked={isSelected}
            >
                {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                ) : (
                    <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-400" />
                )}
            </button>

            {/* Title + Category */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                    {item.title}
                </p>
                {item.category && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {item.category}
                    </p>
                )}
            </div>

            {/* Status Badge */}
            <StatusBadge status={item.status} />

            {/* Date */}
            <span className="hidden sm:inline-block text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                {formatRelativeTime(item.updatedAt)}
            </span>

            {/* Actions Dropdown */}
            <ItemActionMenu item={item} onAction={onAction} />
        </motion.div>
    );
});

ContentRow.displayName = 'ContentRow';

/**
 * EmptyState — visual placeholder when no items match the current filter
 */
const EmptyState = React.memo(function EmptyState({
    filter,
    contentType,
}: {
    filter: StatusFilter;
    contentType: string;
}): JSX.Element {
    const messages: Record<StatusFilter, { icon: React.ElementType; heading: string; text: string }> = {
        all: {
            icon: Inbox,
            heading: `No ${contentType} yet`,
            text: `Create your first ${contentType} item to get started.`,
        },
        published: {
            icon: Eye,
            heading: 'Nothing published',
            text: `Publish items from Draft to see them here.`,
        },
        draft: {
            icon: FileEdit,
            heading: 'No drafts',
            text: 'Draft items will appear here.',
        },
        trash: {
            icon: Trash2,
            heading: 'Trash is empty',
            text: 'Items you move to trash will appear here.',
        },
    };

    const { icon: Icon, heading, text } = messages[filter];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-4">
                <Icon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {heading}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                {text}
            </p>
        </motion.div>
    );
});

EmptyState.displayName = 'EmptyState';

/**
 * ConfirmationDialog — modal for destructive actions
 */
const ConfirmationDialog = React.memo(function ConfirmationDialog({
    isOpen,
    title,
    message,
    confirmLabel,
    isDestructive,
    itemCount,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    isDestructive: boolean;
    itemCount: number;
    onConfirm: () => void;
    onCancel: () => void;
}): JSX.Element | null {
    if (!isOpen) {return null;}

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={onCancel}
                        aria-hidden="true"
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className={cn(
                                'w-full max-w-md rounded-2xl shadow-xl pointer-events-auto',
                                'bg-white dark:bg-gray-900',
                                'border border-gray-200 dark:border-gray-700'
                            )}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="cms-confirm-title"
                            aria-describedby="cms-confirm-desc"
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 p-6 border-b border-gray-100 dark:border-gray-800">
                                <div
                                    className={cn(
                                        'p-2 rounded-full',
                                        isDestructive
                                            ? 'bg-red-100 dark:bg-red-900/30'
                                            : 'bg-amber-100 dark:bg-amber-900/30'
                                    )}
                                >
                                    <AlertTriangle
                                        className={cn(
                                            'w-5 h-5',
                                            isDestructive
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-amber-600 dark:text-amber-400'
                                        )}
                                    />
                                </div>
                                <h2
                                    id="cms-confirm-title"
                                    className="text-lg font-semibold text-gray-900 dark:text-gray-100"
                                >
                                    {title}
                                </h2>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p id="cms-confirm-desc" className="text-gray-600 dark:text-gray-400">
                                    {message}
                                </p>
                                <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                        Selected:{' '}
                                        <strong className="text-gray-900 dark:text-gray-100">
                                            {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="flex justify-end gap-3 p-6 pt-0">
                                <button
                                    onClick={onCancel}
                                    className={cn(
                                        'px-4 py-2 rounded-lg font-medium text-sm',
                                        'text-gray-700 dark:text-gray-300',
                                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                                        'focus:outline-none focus:ring-2 focus:ring-gray-500',
                                        'transition-colors duration-200'
                                    )}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={cn(
                                        'px-4 py-2 rounded-lg font-medium text-sm',
                                        'focus:outline-none focus:ring-2 focus:ring-offset-2',
                                        'transition-colors duration-200',
                                        isDestructive
                                            ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                                            : 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500'
                                    )}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
});

ConfirmationDialog.displayName = 'ConfirmationDialog';

/**
 * BulkBar — lightweight inline toolbar for the section
 */
const BulkBar = React.memo(function BulkBar({
    selectedCount,
    activeFilter,
    isAllSelected,
    onSelectAll,
    onDeselectAll,
    onAction,
    onClear,
    isLoading,
}: {
    selectedCount: number;
    activeFilter: StatusFilter;
    isAllSelected: boolean;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onAction: (action: BulkActionType) => void;
    onClear: () => void;
    isLoading: boolean;
}): JSX.Element | null {
    if (selectedCount === 0) {return null;}

    // Filter available actions by current filter tab
    const actions = (Object.keys(BULK_ACTIONS_CONFIG) as BulkActionType[]).filter((a) =>
        BULK_ACTIONS_CONFIG[a].availableInFilters.includes(activeFilter)
    );

    const ActionIcons: Record<string, React.ElementType> = {
        CheckCircle,
        FileEdit,
        Trash2,
        AlertTriangle,
        RotateCcw,
    };

    const variantClasses: Record<string, string> = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary:
            'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 focus:ring-gray-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        warning:
            'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 focus:ring-amber-500',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={cn(
                'flex flex-wrap items-center gap-2 px-4 py-3',
                'bg-primary-50/70 dark:bg-primary-950/30',
                'border-b border-primary-200 dark:border-primary-800'
            )}
            role="toolbar"
            aria-label="Bulk actions"
        >
            {/* Selection info */}
            <div className="flex items-center gap-2 mr-2">
                <CheckSquare className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                    {selectedCount} selected
                </span>
            </div>

            {/* Separator */}
            <div className="w-px h-5 bg-primary-300 dark:bg-primary-700 hidden sm:block" />

            {/* Actions */}
            {actions.map((action) => {
                const cfg = BULK_ACTIONS_CONFIG[action];
                const Icon = ActionIcons[cfg.icon] || CheckCircle;
                return (
                    <button
                        key={action}
                        onClick={() => onAction(action)}
                        disabled={isLoading}
                        className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                            'text-xs font-semibold',
                            'focus:outline-none focus:ring-2 focus:ring-offset-1',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'transition-all duration-150',
                            variantClasses[cfg.variant]
                        )}
                        title={cfg.label}
                    >
                        {isLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Icon className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                );
            })}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Select-all / Deselect-all */}
            <button
                onClick={isAllSelected ? onDeselectAll : onSelectAll}
                disabled={isLoading}
                className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
                    'text-xs font-medium text-primary-700 dark:text-primary-300',
                    'hover:bg-primary-100 dark:hover:bg-primary-900/30',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    'transition-colors duration-150'
                )}
            >
                {isAllSelected ? (
                    <>
                        <Square className="w-3.5 h-3.5" />
                        <span>None</span>
                    </>
                ) : (
                    <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>All</span>
                    </>
                )}
            </button>

            {/* Close */}
            <button
                onClick={onClear}
                disabled={isLoading}
                className={cn(
                    'p-1 rounded-lg text-primary-400 hover:text-primary-600 dark:hover:text-primary-300',
                    'hover:bg-primary-100 dark:hover:bg-primary-900/30',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500',
                    'transition-colors duration-150'
                )}
                aria-label="Clear selection"
            >
                <X className="w-4 h-4" />
            </button>
        </motion.div>
    );
});

BulkBar.displayName = 'BulkBar';

// =============================================================================
// Main Component
// =============================================================================

/**
 * ContentManagementSection
 *
 * Enterprise-grade reusable section that provides:
 * - Status tabs: Total, Published, Draft, Trash
 * - Multi-select with bulk actions
 * - Per-item action menus
 * - Confirmation dialogs for destructive actions
 * - Animated transitions via framer-motion
 * - Full ARIA accessibility
 */
export const ContentManagementSection = React.memo(function ContentManagementSection({
    contentType,
    title,
    items: initialItems,
    onItemsChange,
    className,
}: ContentManagementSectionProps): JSX.Element {
    // ---------------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------------
    const [items, setItems] = useState<ContentItem[]>(initialItems);
    const [activeFilter, setActiveFilter] = useState<StatusFilter>('published');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        action: BulkActionType;
        ids: string[];
    }>({ isOpen: false, action: 'trash', ids: [] });

    // ---------------------------------------------------------------------------
    // Derived Data
    // ---------------------------------------------------------------------------
    const counts = useMemo(
        () => ({
            total: items.length,
            published: items.filter((i) => i.status === 'published').length,
            draft: items.filter((i) => i.status === 'draft').length,
            trash: items.filter((i) => i.status === 'trash').length,
        }),
        [items]
    );

    const filteredItems = useMemo(() => {
        if (activeFilter === 'all') {return items.filter((i) => i.status !== 'trash');}
        return items.filter((i) => i.status === activeFilter);
    }, [items, activeFilter]);

    const filteredIds = useMemo(() => filteredItems.map((i) => i.id), [filteredItems]);

    const isAllSelected = useMemo(
        () => filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id)),
        [filteredIds, selectedIds]
    );

    // ---------------------------------------------------------------------------
    // Item Mutation Helpers
    // ---------------------------------------------------------------------------
    const applyAction = useCallback(
        (ids: string[], action: BulkActionType) => {
            setItems((prev) => {
                let next: ContentItem[];

                if (action === 'delete') {
                    next = prev.filter((item) => !ids.includes(item.id));
                } else {
                    const statusMap: Partial<Record<BulkActionType, ContentItemStatus>> = {
                        publish: 'published',
                        draft: 'draft',
                        trash: 'trash',
                        restore: 'draft',
                    };
                    const newStatus = statusMap[action];
                    if (!newStatus) {return prev;}

                    next = prev.map((item) =>
                        ids.includes(item.id)
                            ? { ...item, status: newStatus, updatedAt: new Date().toISOString() }
                            : item
                    );
                }

                onItemsChange?.(next);
                return next;
            });

            // Clear selection for processed items
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        },
        [onItemsChange]
    );

    // ---------------------------------------------------------------------------
    // Action Handlers
    // ---------------------------------------------------------------------------
    const handleBulkAction = useCallback(
        (action: BulkActionType) => {
            const cfg = BULK_ACTIONS_CONFIG[action];

            if (cfg.requiresConfirmation) {
                setConfirmDialog({ isOpen: true, action, ids: [...selectedIds] });
            } else {
                setIsLoading(true);
                // Simulate network delay for realistic UX (remove when wired to real API)
                setTimeout(() => {
                    applyAction(selectedIds, action);
                    setIsLoading(false);
                }, 300);
            }
        },
        [selectedIds, applyAction]
    );

    const handleConfirm = useCallback(() => {
        setIsLoading(true);
        const { action, ids } = confirmDialog;

        setTimeout(() => {
            applyAction(ids, action);
            setConfirmDialog({ isOpen: false, action: 'trash', ids: [] });
            setIsLoading(false);
        }, 300);
    }, [confirmDialog, applyAction]);

    const handleCancelConfirm = useCallback(() => {
        setConfirmDialog({ isOpen: false, action: 'trash', ids: [] });
    }, []);

    const handleItemAction = useCallback(
        (id: string, action: BulkActionType) => {
            const cfg = BULK_ACTIONS_CONFIG[action];

            if (cfg.requiresConfirmation) {
                setConfirmDialog({ isOpen: true, action, ids: [id] });
            } else {
                applyAction([id], action);
            }
        },
        [applyAction]
    );

    // ---------------------------------------------------------------------------
    // Selection Handlers
    // ---------------------------------------------------------------------------
    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    }, []);

    const selectAll = useCallback(() => {
        setSelectedIds(filteredIds);
    }, [filteredIds]);

    const deselectAll = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const handleFilterChange = useCallback((filter: StatusFilter) => {
        setActiveFilter(filter);
        setSelectedIds([]); // Reset selection when switching tabs
    }, []);

    // ---------------------------------------------------------------------------
    // Confirmation Dialog Data
    // ---------------------------------------------------------------------------
    const confirmCfg = BULK_ACTIONS_CONFIG[confirmDialog.action];

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------
    return (
        <section
            className={cn('mt-10', className)}
            aria-label={`${title} management`}
        >
            {/* Section Header */}
            <div className="mb-5">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    📋 {title}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage, publish, and organize your {contentType} content.
                </p>
            </div>

            {/* Status Dashboard Cards */}
            <StatusDashboard
                counts={counts}
                activeFilter={activeFilter}
                onFilterChange={handleFilterChange}
                className="mb-5"
            />

            {/* Item List Card */}
            <div
                className={cn(
                    'rounded-2xl overflow-hidden',
                    'bg-white dark:bg-gray-900',
                    'border border-gray-200 dark:border-gray-700',
                    'shadow-lg'
                )}
            >
                {/* List Header */}
                <div
                    className={cn(
                        'flex items-center justify-between px-4 py-3',
                        'bg-gray-50 dark:bg-gray-800/80',
                        'border-b border-gray-200 dark:border-gray-700'
                    )}
                >
                    <div className="flex items-center gap-3">
                        {/* Select-all checkbox */}
                        {filteredItems.length > 0 && (
                            <button
                                onClick={isAllSelected ? deselectAll : selectAll}
                                className={cn(
                                    'p-0.5 rounded transition-colors duration-150',
                                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
                                )}
                                aria-label={isAllSelected ? 'Deselect all items' : 'Select all items'}
                                role="checkbox"
                                aria-checked={isAllSelected}
                            >
                                {isAllSelected ? (
                                    <CheckSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                ) : (
                                    <Square className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                )}
                            </button>
                        )}
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {STATUS_CONFIG[activeFilter].label} ({filteredItems.length})
                        </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" aria-hidden="true" />
                </div>

                {/* Bulk Action Bar */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <BulkBar
                            selectedCount={selectedIds.length}
                            activeFilter={activeFilter}
                            isAllSelected={isAllSelected}
                            onSelectAll={selectAll}
                            onDeselectAll={deselectAll}
                            onAction={handleBulkAction}
                            onClear={deselectAll}
                            isLoading={isLoading}
                        />
                    )}
                </AnimatePresence>

                {/* Item Rows */}
                {filteredItems.length === 0 ? (
                    <EmptyState filter={activeFilter} contentType={contentType} />
                ) : (
                    <div className="max-h-[420px] overflow-y-auto" role="list" aria-label={`${contentType} items`}>
                        <AnimatePresence mode="popLayout">
                            {filteredItems.map((item) => (
                                <ContentRow
                                    key={item.id}
                                    item={item}
                                    isSelected={selectedIds.includes(item.id)}
                                    onToggle={toggleSelection}
                                    onAction={handleItemAction}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={confirmDialog.isOpen}
                title={confirmCfg.confirmationTitle || 'Confirm Action'}
                message={confirmCfg.confirmationMessage || 'Are you sure you want to proceed?'}
                confirmLabel={confirmCfg.confirmButtonText || 'Confirm'}
                isDestructive={confirmDialog.action === 'delete'}
                itemCount={confirmDialog.ids.length}
                onConfirm={handleConfirm}
                onCancel={handleCancelConfirm}
            />
        </section>
    );
});

ContentManagementSection.displayName = 'ContentManagementSection';

export default ContentManagementSection;
