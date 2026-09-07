/**
 * Image riddles analytics sink (upgrade plan A3 / analytics plan Phase 3).
 *
 * Forwards image-riddle action events to the shared analytics tracker
 * (`lib/analytics.ts`), which batches them to `POST /analytics/events`.
 * Event names follow the `analyticsEvent` presets declared in
 * `default-actions.ts` (answer_submitted, hint_revealed, riddle_skipped,
 * answer_revealed, share_opened, …).
 */

import { track } from '@/lib/analytics';

export function trackImageRiddleEvent(event: string, metadata?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;

  // Shim from the upgrade plan: real sink is the shared batched tracker.
  // `event` may be snake_case preset names (answer_submitted) — normalize to
  // the `<object>_<action>` convention as image_riddle_<action>.
  const normalized = event.replace(/^image[-_]riddle[-_]/i, '').toLowerCase();
  track(`image_riddle_${normalized}`, metadata, { module: 'image-riddles' });
}
