/**
 * ============================================================================
 * analytics.ts — client analytics tracker (analytics-data-collection plan §8)
 * ============================================================================
 * Single choke point for every client-side analytics event. Events are
 * queued in memory and flushed to `POST /analytics/events` in batches —
 * analytics must never block gameplay or UI, so every failure is swallowed
 * and retried on a bounded queue.
 *
 * Common envelope (plan §8): eventName, module, guestId, sessionId, page,
 * clientTs. The userId is resolved server-side from the Bearer token (the
 * ingest endpoint runs the JWT strategy softly), so no user data is read
 * client-side here.
 * ============================================================================
 */

import { api, API_BASE_URL } from './api-client';
import { getGuestId } from './guest-id';

export type AnalyticsModuleName = 'quiz-mcq' | 'riddle-mcq' | 'jokes' | 'image-riddles' | 'site';

/** Display labels — kept beside the union so a new module must update both (plan/13-analytics.md P3). */
export const MODULE_LABELS: Record<AnalyticsModuleName, string> = {
  'quiz-mcq': 'Quiz MCQ',
  'riddle-mcq': 'Riddle MCQ',
  jokes: 'Dad Jokes',
  'image-riddles': 'Image Riddles',
  site: 'Site',
};

interface AnalyticsPayload {
  eventName: string;
  module?: string | undefined;
  guestId?: string | undefined;
  sessionId?: string | undefined;
  page?: string | undefined;
  properties?: Record<string, unknown> | undefined;
  clientTs: string;
}

export interface TrackOptions {
  module?: AnalyticsModuleName | undefined;
  sessionId?: string | undefined;
}

const EVENT_NAME_RE = /^[a-z][a-z0-9_]{2,63}$/;
const FLUSH_INTERVAL_MS = 10_000;
const FLUSH_THRESHOLD = 20;
const MAX_BATCH = 50;
const MAX_QUEUE = 200;

let queue: AnalyticsPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;
let initialized = false;

/**
 * Track an event. Safe to call anywhere (client-only, never throws).
 * Events are batched and flushed every 10s, or immediately at 20 queued.
 */
export function track(
  eventName: string,
  properties?: Record<string, unknown>,
  options?: TrackOptions
): void {
  if (typeof window === 'undefined') return;
  if (!EVENT_NAME_RE.test(eventName)) {
    console.warn(`[analytics] invalid eventName "${eventName}" — dropped`);
    return;
  }

  queue.push({
    eventName,
    module: options?.module,
    guestId: getGuestId() || undefined,
    sessionId: options?.sessionId,
    page: window.location.pathname,
    properties,
    clientTs: new Date().toISOString(),
  });

  // Bound the queue: drop the OLDEST events when saturated.
  if (queue.length > MAX_QUEUE) {
    queue.splice(0, queue.length - MAX_QUEUE);
  }

  if (queue.length >= FLUSH_THRESHOLD) {
    void flush();
  } else {
    scheduleFlush();
  }
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_INTERVAL_MS);
}

/** Send the current batch. Failed batches are re-queued (bounded) for retry. */
export async function flush(): Promise<void> {
  if (flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.splice(0, MAX_BATCH);
  try {
    await api.post('/analytics/events', { events: batch });
  } catch {
    queue = [...batch, ...queue].slice(0, MAX_QUEUE);
  } finally {
    flushing = false;
    if (queue.length > 0) scheduleFlush();
  }
}

/**
 * Last-chance flush when the tab hides/closes — uses sendBeacon so events
 * survive navigation. The beacon can't carry the Authorization header, so
 * these rows are guest-attributed (guestId still identifies the device).
 */
function flushOnExit(): void {
  if (queue.length === 0 || typeof navigator === 'undefined') return;
  const events = queue;
  queue = [];
  try {
    const blob = new Blob([JSON.stringify({ events })], { type: 'application/json' });
    if (navigator.sendBeacon?.(`${API_BASE_URL}/analytics/events`, blob)) return;
    // sendBeacon unavailable/refused — put the batch back for the next flush.
    queue = [...events, ...queue].slice(0, MAX_QUEUE);
  } catch {
    queue = [...events, ...queue].slice(0, MAX_QUEUE);
  }
}

/** Attach exit listeners. Idempotent; call once from the root providers. */
export function initAnalytics(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushOnExit();
  });
  window.addEventListener('pagehide', flushOnExit);
}
