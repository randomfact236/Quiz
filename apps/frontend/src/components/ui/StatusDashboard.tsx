/**
 * ============================================================================
 * STATUS DASHBOARD COMPONENT
 * ============================================================================
 * @module components/ui/StatusDashboard
 * @description Enterprise-grade status dashboard with filtering and analytics
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  CheckCircle,
  FileEdit,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import React, { useMemo, useCallback } from 'react';

import { cn, formatNumber, calculatePercentage } from '@/lib/utils';
import type { StatusFilter, StatusCardConfig } from '@/types/status.types';
import { STATUS_CONFIG } from '@/types/status.types';

/**
 * Status counts data structure
 */
export interface StatusCountsData {
  total: number;
  published: number;
  draft: number;
  trash: number;
}

/**
 * Props for the StatusDashboard component
 */
export interface StatusDashboardProps {
  /** Status counts data */
  counts: StatusCountsData;
  /** Currently active filter */
  activeFilter: StatusFilter;
  /** Callback when filter changes */
  onFilterChange: (filter: StatusFilter) => void;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** Retry callback */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Icon mapping for status cards
 */
const ICONS = {
  Layers,
  CheckCircle,
  FileEdit,
  Trash2,
} as const;

/**
 * Color configuration for each status type
 */
const COLOR_CONFIG = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-900 dark:text-blue-100',
    subtext: 'text-blue-600 dark:text-blue-400',
    accent: 'bg-blue-500',
    ring: 'ring-blue-500',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/50',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-900 dark:text-green-100',
    subtext: 'text-green-600 dark:text-green-400',
    accent: 'bg-green-500',
    ring: 'ring-green-500',
    hover: 'hover:bg-green-100 dark:hover:bg-green-950/50',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-900 dark:text-yellow-100',
    subtext: 'text-yellow-600 dark:text-yellow-400',
    accent: 'bg-yellow-500',
    ring: 'ring-yellow-500',
    hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-950/50',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-900 dark:text-red-100',
    subtext: 'text-red-600 dark:text-red-400',
    accent: 'bg-red-500',
    ring: 'ring-red-500',
    hover: 'hover:bg-red-100 dark:hover:bg-red-950/50',
  },
} as const;

/**
 * Individual status card component
 */
interface StatusCardProps {
  config: StatusCardConfig;
  count: number;
  total: number;
  isActive: boolean;
  isLoading: boolean;
  onClick: () => void;
  index: number;
}

/**
 * StatusCard - Individual stat card with count and percentage
 */
const StatusCard = React.memo(function StatusCard({
  config,
  count,
  total,
  isActive,
  isLoading,
  onClick,
  index,
}: StatusCardProps): JSX.Element {
  const colors = COLOR_CONFIG[config.color];
  const percentage = calculatePercentage(count, total);
  const Icon = ICONS[config.icon as keyof typeof ICONS];

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  const countVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
  };

  return (
    <motion.button
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        // Base styles
        'relative flex flex-col p-4 sm:p-5 rounded-xl border-2',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'dark:focus:ring-offset-secondary-900',
        'w-full text-left',
        // Color styles
        colors.bg,
        colors.border,
        colors.hover,
        // Active state
        isActive && `ring-2 ring-offset-2 ${colors.ring}`,
        // Disabled state
        isLoading && 'opacity-60 cursor-not-allowed',
        // Hover effects
        !isLoading && 'hover:shadow-md hover:-translate-y-0.5'
      )}
      aria-selected={isActive}
      aria-label={`${config.ariaLabel}: ${count} items (${percentage.toFixed(1)}%)`}
      role="tab"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Icon and Label */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            colors.accent,
            'bg-opacity-20 dark:bg-opacity-30'
          )}
        >
          <Icon className={cn('w-5 h-5', colors.subtext)} aria-hidden="true" />
        </div>
        <span className={cn('font-semibold text-sm sm:text-base', colors.text)}>
          {config.label}
        </span>
      </div>

      {/* Count */}
      <div className="flex items-baseline gap-2 mb-3">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                'h-8 sm:h-10 w-16 rounded bg-current opacity-20 animate-pulse',
                colors.subtext
              )}
            />
          ) : (
            <motion.span
              key="count"
              variants={countVariants}
              initial="initial"
              animate="animate"
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={cn(
                'text-2xl sm:text-3xl font-bold tabular-nums',
                colors.text
              )}
            >
              {formatNumber(count)}
            </motion.span>
          )}
        </AnimatePresence>
        {!isLoading && total > 0 && (
          <span className={cn('text-xs sm:text-sm font-medium', colors.subtext)}>
            ({percentage.toFixed(0)}%)
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-auto">
        <div
          className={cn(
            'h-1.5 sm:h-2 rounded-full overflow-hidden',
            'bg-current opacity-20',
            colors.subtext
          )}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <motion.div
            className={cn('h-full rounded-full', colors.accent)}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className={cn(
            'absolute -top-1 -right-1 w-3 h-3 rounded-full',
            colors.accent
          )}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
});

/**
 * Skeleton loader for status cards
 */
function StatusCardSkeleton(): JSX.Element {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={`skeleton-${i}`}
          className="p-4 sm:p-5 rounded-xl border-2 border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 animate-pulse"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-secondary-200 dark:bg-secondary-700" />
            <div className="h-4 w-16 rounded bg-secondary-200 dark:bg-secondary-700" />
          </div>
          <div className="h-8 sm:h-10 w-20 rounded bg-secondary-200 dark:bg-secondary-700 mb-3" />
          <div className="h-1.5 sm:h-2 rounded-full bg-secondary-200 dark:bg-secondary-700" />
        </div>
      ))}
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: (() => void) | undefined;
}): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/50">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-red-900 dark:text-red-100">
            Failed to load status data
          </h3>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-red-600 text-white font-medium text-sm',
              'hover:bg-red-700 active:bg-red-800',
              'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
              'dark:focus:ring-offset-secondary-900',
              'transition-colors duration-200',
              'whitespace-nowrap'
            )}
            aria-label="Retry loading status data"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * StatusDashboard - Main dashboard component
 */
export const StatusDashboard = React.memo(function StatusDashboard({
  counts,
  activeFilter,
  onFilterChange,
  loading = false,
  error = null,
  onRetry,
  className = '',
}: StatusDashboardProps): JSX.Element {
  /**
   * Handle filter change with keyboard support
   */
  const handleFilterChange = useCallback(
    (filter: StatusFilter) => {
      if (!loading && filter !== activeFilter) {
        onFilterChange(filter);
      }
    },
    [activeFilter, loading, onFilterChange]
  );

  /**
   * Memoized status configurations
   */
  const statusConfigs = useMemo(() => {
    const countMap: Record<StatusFilter, number> = {
      all: counts.total,
      published: counts.published,
      draft: counts.draft,
      trash: counts.trash,
    };
    return (Object.keys(STATUS_CONFIG) as StatusFilter[]).map((key) => ({
      key,
      config: STATUS_CONFIG[key],
      count: countMap[key] ?? 0,
    }));
  }, [counts]);

  // Show skeleton while loading (but not on error)
  if (loading && !error) {
    return (
      <div
        className={cn('w-full', className)}
        role="status"
        aria-label="Loading status data"
      >
        <StatusCardSkeleton />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <ErrorState error={error} onRetry={onRetry} />
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        role="tablist"
        aria-label="Filter by status"
      >
        {statusConfigs.map(({ key, config, count }, index) => (
          <StatusCard
            key={key}
            config={config}
            count={count}
            total={counts.total}
            isActive={activeFilter === key}
            isLoading={loading}
            onClick={() => handleFilterChange(key)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

StatusDashboard.displayName = 'StatusDashboard';

export default StatusDashboard;
