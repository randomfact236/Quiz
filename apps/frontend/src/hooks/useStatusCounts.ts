/**
 * ============================================================================
 * USE STATUS COUNTS HOOK - Data fetching for status dashboard
 * ============================================================================
 * @module hooks/useStatusCounts
 * @description Enterprise-grade hook for fetching and managing status counts
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import { StatusService, StatusServiceError } from '@/services/status.service';
import { STATUS_REFRESH_INTERVAL } from '@/lib/constants';
import type { StatusCounts } from '@/types/status.types';

/**
 * Hook configuration options
 */
interface UseStatusCountsOptions {
  /** API endpoint for status counts */
  endpoint: string;
  /** Auto-refresh interval in milliseconds (0 to disable) */
  refreshInterval?: number;
  /** Enable initial fetch on mount */
  fetchOnMount?: boolean;
  /** Callback when data is fetched successfully */
  onSuccess?: (data: StatusCounts) => void;
  /** Callback when fetch fails */
  onError?: (error: Error) => void;
}

/**
 * Hook return type
 */
export interface UseStatusCountsReturn {
  /** Status counts data */
  counts: StatusCounts;
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Refetch data */
  refetch: () => Promise<void>;
  /** Retry after error */
  retry: () => Promise<void>;
  /** Last fetch timestamp */
  lastFetched: Date | null;
  /** Whether data is stale */
  isStale: boolean;
}

/**
 * Default empty counts
 */
const DEFAULT_COUNTS: StatusCounts = {
  total: 0,
  published: 0,
  draft: 0,
  trash: 0,
};

/**
 * Hook for fetching and managing status counts
 * @param options - Hook configuration
 * @returns Status counts state and fetch controls
 * @example
 * const { counts, isLoading, error, refetch } = useStatusCounts({
 *   endpoint: '/quizzes/counts',
 *   refreshInterval: 30000,
 * });
 */
export function useStatusCounts(
  options: UseStatusCountsOptions
): UseStatusCountsReturn {
  const {
    endpoint,
    refreshInterval = STATUS_REFRESH_INTERVAL,
    fetchOnMount = true,
    onSuccess,
    onError,
  } = options;

  // State
  const [counts, setCounts] = useState<StatusCounts>(DEFAULT_COUNTS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch status counts from API
   */
  const fetchCounts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await StatusService.getStatusCounts(endpoint);
      setCounts(data);
      setLastFetched(new Date());
      setIsStale(false);
      onSuccess?.(data);
    } catch (err) {
      const errorMessage =
        err instanceof StatusServiceError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'An unexpected error occurred';

      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  /**
   * Refetch data
   */
  const refetch = useCallback(async (): Promise<void> => {
    await fetchCounts();
  }, [fetchCounts]);

  /**
   * Retry after error (alias for refetch)
   */
  const retry = useCallback(async (): Promise<void> => {
    setError(null);
    await fetchCounts();
  }, [fetchCounts]);

  // Initial fetch
  useEffect(() => {
    if (fetchOnMount) {
      fetchCounts();
    }
  }, [fetchOnMount, fetchCounts]);

  // Auto-refresh interval (local data changes quickly, polling is still useful to reflect changes made elsewhere)
  useEffect(() => {
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        setIsStale(true);
        fetchCounts();
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval, fetchCounts]);

  return {
    counts,
    isLoading,
    error,
    refetch,
    retry,
    lastFetched,
    isStale,
  };
}

export default useStatusCounts;
