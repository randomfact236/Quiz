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
import { formatCount, ogData } from '@/lib/og-data';
import { getPublicSettings } from '@/lib/public-settings';

export const size = OG_1200x600;
export const contentType = 'image/png';
export const alt = 'PigZap — interactive quizzes, riddles, dad jokes and image puzzles';
export const revalidate = 900;

export default async function TwitterImage(): Promise<ImageResponse> {
  const { seo } = await getPublicSettings();
  const siteName = seo?.siteName?.trim() || 'PigZap';

  const [quizCounts, riddleTotal, jokesTotal, imageRiddlesTotal] = await Promise.all([
    ogData.quizCounts(),
    ogData.riddleTotal(),
    ogData.jokesTotal(),
    ogData.imageRiddlesTotal(),
  ]);
  const quizTotal = quizCounts
    ? Object.values(quizCounts.bySubject).reduce((sum, n) => sum + (Number(n) || 0), 0)
    : null;

  return new ImageResponse(
    HomeShareImage({
      siteName,
      height: OG_1200x600.height,
      stats: [
        { value: formatCount(quizTotal), label: 'questions' },
        { value: formatCount(riddleTotal), label: 'riddles' },
        { value: formatCount(jokesTotal), label: 'jokes' },
        { value: formatCount(imageRiddlesTotal), label: 'image puzzles' },
        { value: '8', label: 'games' },
      ],
    }),
    OG_1200x600
  );
}
