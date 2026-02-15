/**
 * ============================================================================
 * STATUS SERVICE - Standalone storage-based status management
 * ============================================================================
 * @module services/status.service
 * @description Standalone service that manages status counts and bulk actions
 *              using localStorage persistence.
 */

import { getItem, setItem, STORAGE_KEYS } from '@/lib/storage';
import type {
  StatusCounts,
  BulkActionResult,
  BulkActionType,
} from '@/types/status.types';

/**
 * Custom error class for Service errors
 */
export class StatusServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StatusServiceError';
  }
}

/**
 * Question item structure for status operations
 */
interface StatusQuestion {
  id: string | number;
  status: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Storage structure for questions (grouped by subject)
 */
interface QuestionsBySubject {
  [subject: string]: StatusQuestion[];
}

// Helper to determine storage key from endpoint
function getKeyFromEndpoint(endpoint: string): string | null {
  if (endpoint.includes('quizzes') || endpoint.includes('questions')) {return STORAGE_KEYS.QUESTIONS;}
  if (endpoint.includes('jokes')) {return STORAGE_KEYS.JOKES;}
  if (endpoint.includes('image-riddles')) {return STORAGE_KEYS.IMAGE_RIDDLES;}
  if (endpoint.includes('riddles')) {return STORAGE_KEYS.RIDDLES;}
  return null;
}

// Helper to get items array from storage (handling the nested structure of Questions)
interface StoredItem {
  id: string;
  status: string;
  [key: string]: unknown;
}

function getItemsFromStorage(key: string): StoredItem[] {
  const data = getItem(key, []);

  if (key === STORAGE_KEYS.QUESTIONS) {
    // Questions are stored as Record<string, Question[]>
    if (Array.isArray(data)) {return data as StoredItem[];}
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).flat() as StoredItem[];
    }
    return [];
  }

  return Array.isArray(data) ? data as StoredItem[] : [];
}

// Counter tracking for bulk actions
interface BulkActionCounters {
  count: number;
  changed: boolean;
}

/**
 * Updates a question item based on the bulk action
 */
function updateQuestionItem(
  q: StatusQuestion,
  ids: string[],
  action: BulkActionType,
  processedIds: string[],
  counters: BulkActionCounters
): StatusQuestion | null {
  if (!ids.includes(String(q.id))) {
    return q;
  }

  processedIds.push(String(q.id));
  counters.count++;
  counters.changed = true;

  if (action === 'delete') {
    return null; // Filter out deleted items
  }

  return { ...q, status: action, updatedAt: new Date().toISOString() };
}

/**
 * Updates a simple item based on the bulk action
 */
function updateSimpleItem(
  item: StatusQuestion,
  ids: string[],
  action: BulkActionType,
  processedIds: string[],
  counters: BulkActionCounters
): StatusQuestion | null {
  if (!ids.includes(String(item.id))) {
    return item;
  }

  processedIds.push(String(item.id));
  counters.count++;
  counters.changed = true;

  if (action === 'delete') {
    return null; // Filter out deleted items
  }

  return { ...item, status: action, updatedAt: new Date().toISOString() };
}

/**
 * Status Service API (Standalone)
 */
export const StatusService = {
  /**
   * Fetches status counts from localStorage
   */
  async getStatusCounts(
    endpoint: string
  ): Promise<StatusCounts> {
    // Simulate async delay
    await new Promise(resolve => setTimeout(resolve, 50));

    const key = getKeyFromEndpoint(endpoint);
    if (!key) {
      // Return zero counts for unknown endpoints instead of throwing
      return { total: 0, published: 0, draft: 0, trash: 0 };
    }

    const items = getItemsFromStorage(key);

    const counts = {
      total: items.length,
      published: 0,
      draft: 0,
      trash: 0,
    };

    items.forEach((item: StoredItem) => {
      if (item.status === 'published') {counts.published++;}
      else if (item.status === 'draft') {counts.draft++;}
      else if (item.status === 'trash') {counts.trash++;}
    });

    return counts;
  },

  /**
   * Executes a bulk action on multiple items in localStorage
   */
  async executeBulkAction(
    endpoint: string,
    action: BulkActionType,
    ids: string[]
  ): Promise<BulkActionResult> {
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!ids.length) {
      throw new StatusServiceError(
        'No items selected for bulk action',
        'NO_ITEMS_SELECTED'
      );
    }

    const key = getKeyFromEndpoint(endpoint);
    if (!key) {
      throw new StatusServiceError(
        'Invalid content type',
        'INVALID_ENDPOINT'
      );
    }

    const counters: BulkActionCounters = { count: 0, changed: false };
    const processedIds: string[] = [];
    const failedIds: string[] = [];

    // Handling specific content types
    if (key === STORAGE_KEYS.QUESTIONS) {
      // Questions are Record<string, Question[]>
      const allQuestions = getItem<QuestionsBySubject>(key, {});

      // Iterate through all subjects (keys)
      Object.keys(allQuestions).forEach(subject => {
        const questions = allQuestions[subject] || [];
        allQuestions[subject] = questions
          .map(q => updateQuestionItem(q, ids, action, processedIds, counters))
          .filter(Boolean) as StatusQuestion[];
      });

      if (counters.changed) {
        setItem(key, allQuestions);
      }
    } else {
      // Simple Array Types (Jokes, Riddles, Image Riddles)
      const currentItems = getItem<StatusQuestion[]>(key, []);

      const newItems = currentItems
        .map(item => updateSimpleItem(item, ids, action, processedIds, counters))
        .filter(Boolean) as StatusQuestion[];

      if (counters.changed) {
        setItem(key, newItems);
      }
    }

    return {
      success: true,
      affectedCount: counters.count,
      processedIds,
      failedIds
    };
  },

  /**
   * Type guard for StatusCounts
   */
  isValidStatusCounts(data: unknown): data is StatusCounts {
    if (typeof data !== 'object' || data === null) {return false;}

    const counts = data as Record<string, unknown>;
    return (
      typeof counts['total'] === 'number' &&
      typeof counts['published'] === 'number' &&
      typeof counts['draft'] === 'number' &&
      typeof counts['trash'] === 'number'
    );
  },

  /**
   * Type guard for BulkActionResult
   */
  isValidBulkActionResult(data: unknown): data is BulkActionResult {
    if (typeof data !== 'object' || data === null) {return false;}

    const result = data as Record<string, unknown>;
    return (
      typeof result['success'] === 'boolean' &&
      typeof result['affectedCount'] === 'number' &&
      Array.isArray(result['processedIds']) &&
      Array.isArray(result['failedIds'])
    );
  },
} as const;

export default StatusService;
