/**
 * ============================================================================
 * twitter-image.tsx — Home X/Twitter variant (share-design-system WP0)
 * ============================================================================
 * Same approved template as the home master image, cropped to X's 2:1
 * (1200×600) — pillars and stats stay inside the safe zone.
 * ============================================================================
 */

import { ImageResponse } from 'next/og';

import { HomeShareImage, OG_1200x600 } from '@/components/og/share-templates';
import { homeStats } from '@/lib/og-data';
import { getPublicSettings } from '@/lib/public-settings';

export const size = OG_1200x600;
export const contentType = 'image/png';
export const alt = 'PigZap — interactive quizzes, riddles, dad jokes and image puzzles';
export const revalidate = 900;

export default async function TwitterImage(): Promise<ImageResponse> {
  const { seo } = await getPublicSettings();
  const siteName = seo?.siteName?.trim() || 'PigZap';

  return new ImageResponse(
    HomeShareImage({
      siteName,
      height: OG_1200x600.height,
      stats: await homeStats(),
    }),
    OG_1200x600
  );
}
