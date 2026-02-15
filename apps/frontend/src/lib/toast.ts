/**
 * ============================================================================
 * TOAST NOTIFICATION SYSTEM
 * ============================================================================
 * @module lib/toast
 * @description Toast notification utilities for displaying feedback to users
 */

import { generateId } from './utils';
import {
  TOAST_DURATION,
  ERROR_TOAST_DURATION,
} from './constants';

import type { Toast, ToastType } from '@/types/status.types';

/**
 * Callback function type for toast subscribers
 */
type ToastCallback = (toasts: Toast[]) => void;

/**
 * Toast state manager - singleton pattern
 */
class ToastManager {
  private toasts: Toast[] = [];
  private subscribers: ToastCallback[] = [];

  /**
   * Subscribe to toast updates
   * @param callback - Function to call when toasts change
   * @returns Unsubscribe function
   */
  subscribe(callback: ToastCallback): () => void {
    this.subscribers.push(callback);
    callback([...this.toasts]);

    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notify(): void {
    this.subscribers.forEach((callback) => callback([...this.toasts]));
  }

  /**
   * Add a new toast notification
   * @param message - Toast message
   * @param type - Toast type
   * @param duration - Auto-dismiss duration (default: 5000ms)
   * @returns Toast ID
   */
  add(message: string, type: ToastType = 'info', duration = TOAST_DURATION): string {
    const id = generateId('toast');
    const toast: Toast = { id, message, type, duration };

    this.toasts = [...this.toasts, toast];
    this.notify();

    // Auto-dismiss if duration is provided
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  /**
   * Dismiss a toast by ID
   * @param id - Toast ID to dismiss
   */
  dismiss(id: string): void {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notify();
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.toasts = [];
    this.notify();
  }

  /**
   * Show a success toast
   * @param message - Success message
   * @param duration - Auto-dismiss duration
   * @returns Toast ID
   */
  success(message: string, duration?: number): string {
    return this.add(message, 'success', duration);
  }

  /**
   * Show an error toast
   * @param message - Error message
   * @param duration - Auto-dismiss duration
   * @returns Toast ID
   */
  error(message: string, duration?: number): string {
    return this.add(message, 'error', duration || ERROR_TOAST_DURATION);
  }

  /**
   * Show a warning toast
   * @param message - Warning message
   * @param duration - Auto-dismiss duration
   * @returns Toast ID
   */
  warning(message: string, duration?: number): string {
    return this.add(message, 'warning', duration);
  }

  /**
   * Show an info toast
   * @param message - Info message
   * @param duration - Auto-dismiss duration
   * @returns Toast ID
   */
  info(message: string, duration?: number): string {
    return this.add(message, 'info', duration);
  }
}

// Export singleton instance
export const toastManager = new ToastManager();

/**
 * Hook-compatible toast API
 */
export const toast = {
  success: (message: string, duration?: number) => toastManager.success(message, duration),
  error: (message: string, duration?: number) => toastManager.error(message, duration),
  warning: (message: string, duration?: number) => toastManager.warning(message, duration),
  info: (message: string, duration?: number) => toastManager.info(message, duration),
  dismiss: (id: string) => toastManager.dismiss(id),
  dismissAll: () => toastManager.dismissAll(),
  subscribe: (callback: ToastCallback) => toastManager.subscribe(callback),
} as const;

export default toast;
