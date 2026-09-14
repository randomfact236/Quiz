import { ImageResponse } from 'next/og';

import { getPublicSettings } from '@/lib/public-settings';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'AI Quiz — interactive quizzes, riddles, dad jokes and image puzzles';

export default async function OpengraphImage(): Promise<ImageResponse> {
  // Same cached fetch + fallback as the root layout's generateMetadata
  // (plan/15-seo.md P1) — single shared implementation in lib/public-settings.
  const { seo } = await getPublicSettings();
  const siteName = seo?.siteName?.trim() || 'AI Quiz';
  const description =
    seo?.description?.trim() ||
    'Interactive quizzes, riddles, dad jokes and image puzzles — test your knowledge and have fun!';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #A5A3E4 0%, #BF7076 100%)',
        color: 'white',
        padding: 80,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        🎯 {siteName}
      </div>
      <div
        style={{
          marginTop: 32,
          display: 'flex',
          fontSize: 40,
          opacity: 0.92,
          maxWidth: 900,
        }}
      >
        {description}
      </div>
      <div
        style={{
          marginTop: 48,
          display: 'flex',
          fontSize: 28,
          background: 'rgba(255,255,255,0.18)',
          padding: '12px 36px',
          borderRadius: 999,
        }}
      >
        Quizzes · Riddles · Dad Jokes · Image Puzzles
      </div>
    </div>,
    size
  );
}
