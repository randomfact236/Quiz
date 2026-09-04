/**
 * ============================================================================
 * error-tracking.ts — client error + API failure telemetry (plan/13 §4b A6)
 * ============================================================================
 * Turns frontend crashes and API failures into analytics events:
 * `client_error` (window errors, unhandled rejections, error boundaries) and
 * `api_failed` (api-client request failures). Telemetry must stay quiet while
 * things are on fire: a hard per-session cap plus per-message dedup, and the
 * analytics endpoints themselves are never reported (a failing flush must not
 * feed itself — see onApiFailure exclusion in this module's subscription).
 * ============================================================================
 */

import { track } from './analytics';
import { onApiFailure } from './api-client';

const MAX_ERROR_EVENTS = 20;

let sent = 0;
const seenKeys = new Set<string>();
let initialized = false;

const truncate = (value: unknown, max = 300): string => {
  const text = String(value ?? '');
  return text.length > max ? text.slice(0, max) : text;
};

function report(
  kind: 'client_error' | 'api_failed',
  dedupKey: string,
  properties: Record<string, unknown>
): void {
  if (sent >= MAX_ERROR_EVENTS) return;
  const key = `${kind}:${dedupKey}`.slice(0, 200);
  if (seenKeys.has(key)) return;
  seenKeys.add(key);
  sent++;
  track(kind, properties, { module: 'site' });
}

/** Attach global listeners + the api-failure hook. Idempotent. */
export function initErrorTracking(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', (event) => {
    report('client_error', `${event.message}@${event.lineno}`, {
      source: 'window_error',
      message: truncate(event.message) || 'unknown',
      path: window.location.pathname,
      line: event.lineno ?? null,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason: unknown = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason ?? 'unknown');
    report('client_error', `rejection:${message}`, {
      source: 'unhandled_rejection',
      message: truncate(message) || 'unknown rejection',
      path: window.location.pathname,
    });
  });

  onApiFailure((endpoint, status) => {
    // Never report analytics traffic — a failing ingest retry loop would
    // otherwise generate an event per retry (plan A6 rate-limiting note).
    if (endpoint.startsWith('/analytics/')) return;
    report('api_failed', `${endpoint}:${status}`, {
      endpoint,
      status,
      path: window.location.pathname,
    });
  });
}

/**
 * Called from Next.js error boundaries (app/error.tsx) — the boundary sees
 * render errors with their server digest, which window.onerror does not.
 */
export function trackBoundaryError(error: Error & { digest?: string }): void {
  report('client_error', `boundary:${error.message}`, {
    source: 'error_boundary',
    message: truncate(error.message) || 'render error',
    digest: error.digest ?? null,
    path: typeof window !== 'undefined' ? window.location.pathname : null,
  });
}
