/**
 * ============================================================================
 * features/image-riddles/lib/share.ts — Web Share with clipboard fallback
 * ============================================================================
 * Browser-only helper backing the `share` action preset (upgrade plan A2).
 * ============================================================================
 */

import type { ImageRiddle } from '@/lib/image-riddles-api';

export type ShareResult = 'shared' | 'copied' | 'failed';

/** Transient feedback shown in the modal after a share attempt. */
export const SHARE_MESSAGES: Record<ShareResult, string | null> = {
  shared: null,
  copied: 'Link copied to clipboard!',
  failed: 'Could not share — please copy the URL manually.',
};

export async function shareRiddleContent(riddle: ImageRiddle): Promise<ShareResult> {
  const category = riddle.category?.name ?? '';
  const url =
    typeof window !== 'undefined'
      ? `${window.location.origin}/image-riddles?category=${encodeURIComponent(category)}`
      : '/image-riddles';
  const text = `Can you solve this image riddle: "${riddle.title}"?`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: riddle.title, text, url });
      return 'shared';
    } catch {
      /* user dismissed or share failed — fall through to clipboard */
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
