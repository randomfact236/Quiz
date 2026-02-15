/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 * @module lib/utils
 * @description Shared utility functions for the frontend application
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  ONE_SECOND_MS,
  SECONDS_PER_MINUTE,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  SECONDS_PER_WEEK,
  MIN_PERCENTAGE,
  MAX_PERCENTAGE,
  RANDOM_ID_SUFFIX_LENGTH,
  TRUNCATION_ELLIPSIS_LENGTH,
} from './constants';

/**
 * Combines multiple class names using clsx and merges Tailwind classes
 * @param inputs - Class values to combine
 * @returns Merged class string
 * @example
 * cn('px-2 py-1', 'bg-blue-500', condition && 'text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Generates a unique ID
 * @param prefix - Optional prefix for the ID
 * @returns Unique ID string
 */
export function generateId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, RANDOM_ID_SUFFIX_LENGTH)}`;
}

/**
 * Formats a number with locale-specific separators
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

/**
 * Calculates percentage and clamps between 0-100
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) {return 0;}
  return Math.min(MAX_PERCENTAGE, Math.max(MIN_PERCENTAGE, (value / total) * MAX_PERCENTAGE));
}

/**
 * Debounces a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Formats a relative time string (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / ONE_SECOND_MS);

  if (diffInSeconds < SECONDS_PER_MINUTE) {return 'just now';}
  if (diffInSeconds < SECONDS_PER_HOUR) {return `${Math.floor(diffInSeconds / SECONDS_PER_MINUTE)}m ago`;}
  if (diffInSeconds < SECONDS_PER_DAY) {return `${Math.floor(diffInSeconds / SECONDS_PER_HOUR)}h ago`;}
  if (diffInSeconds < SECONDS_PER_WEEK) {return `${Math.floor(diffInSeconds / SECONDS_PER_DAY)}d ago`;}
  
  return then.toLocaleDateString();
}

/**
 * Safely parses JSON with a fallback value
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed value or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Creates a promise that resolves after a specified delay
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncates text to a specified length with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {return text;}
  return `${text.slice(0, maxLength - TRUNCATION_ELLIPSIS_LENGTH)}...`;
}
