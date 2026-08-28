/**
 * Image riddles analytics shim (upgrade plan A3).
 *
 * No analytics sink exists anywhere in the repo, so gameplay events are
 * logged via console.debug behind a localStorage flag instead of being
 * silently dropped. To attach a real sink later (POST /events, GA,
 * PostHog, …), replace the body of `trackImageRiddleEvent` — call sites
 * (RiddleGuessPanel's `onAnalytics`, game-hook transitions) stay unchanged.
 *
 * Enable locally: localStorage.setItem('image-riddles:analytics-debug', '1')
 */

export const ANALYTICS_DEBUG_FLAG = 'image-riddles:analytics-debug';

export function trackImageRiddleEvent(event: string, metadata?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  try {
    if (window.localStorage.getItem(ANALYTICS_DEBUG_FLAG) !== '1') return;
  } catch {
    return; // storage unavailable (private mode etc.) — drop silently
  }
  console.debug(`[image-riddles] ${event}`, metadata ?? {});
}
