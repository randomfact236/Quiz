/**
 * Share-count events + public totals (BUG-048).
 *
 * A "share" = one click on a share target (Facebook / X / WhatsApp /
 * LinkedIn / Copy). Totals are public and rendered beside the like and
 * comment counts. Fire-and-forget: a counting failure must never break the
 * share itself.
 */

import { api } from './api-client';

export type SharePlatform = 'facebook' | 'x' | 'whatsapp' | 'linkedin' | 'copy' | 'other';

export async function fireShareEvent(
  contentType: string,
  contentId: string,
  platform: SharePlatform
): Promise<void> {
  try {
    await api.post('/share-counts', { contentType, contentId, platform });
  } catch {
    /* counting is best-effort */
  }
}

export async function getShareCounts(
  contentType: string,
  contentIds: string[]
): Promise<Record<string, number>> {
  if (contentIds.length === 0) return {};
  try {
    const response = await api.get<Record<string, number>>(
      `/share-counts/counts?contentType=${encodeURIComponent(contentType)}&ids=${encodeURIComponent(contentIds.join(','))}`
    );
    return response.data ?? {};
  } catch {
    return {};
  }
}
