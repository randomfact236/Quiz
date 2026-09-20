/**
 * ============================================================================
 * opengraph-image.tsx — Home master share image (share-design-system WP0)
 * ============================================================================
 * The owner-approved multi-platform template: pig icon + wordmark + pillars +
 * LIVE DB stats + domain pill on the brand gradient. Counts revalidate every
 * 15 min so content pushes show up without any cache purging.
 * ============================================================================
 */

import { ImageResponse } from 'next/og';

import { HomeShareImage, OG_1200x630 } from '@/components/og/share-templates';
import { homeStats, pigIconDataUrl } from '@/lib/og-data';
import { getPublicSettings } from '@/lib/public-settings';

export const size = OG_1200x630;
export const contentType = 'image/png';
export const alt = 'PigZap — interactive quizzes, riddles, dad jokes and image puzzles';
export const revalidate = 900;

export default async function OpengraphImage(): Promise<ImageResponse> {
  // Same cached fetch + fallback as the root layout's generateMetadata
  // (plan/15-seo.md P1) — single shared implementation in lib/public-settings.
  const { seo } = await getPublicSettings();
  const siteName = seo?.siteName?.trim() || 'PigZap';

  return new ImageResponse(
    HomeShareImage({
      siteName,
      iconSrc: pigIconDataUrl(),
      height: OG_1200x630.height,
      stats: await homeStats(),
    }),
    OG_1200x630
  );
}
