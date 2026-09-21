import { ImageResponse } from 'next/og';

import { getPublicSettings } from '@/lib/public-settings';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'PigZap — Quizzes · Riddles · Games · Dad Jokes · Image Puzzles';

/** Approved home-share design (BUG-055 / report WP0): brand gradient, pig mark,
 *  wordmark, five pillars, LIVE totals, domain pill. Counts revalidate ≤ 15 min. */
const API_ROOT = (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api').replace(
  /\/+$/,
  ''
);
const API_V1 = API_ROOT.endsWith('/v1') ? API_ROOT : `${API_ROOT}/v1`;

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function quizTotal(): Promise<number | null> {
  const data = (await fetchJson(`${API_V1}/quiz-mcq/question-counts`)) as {
    bySubject?: Record<string, number>;
  } | null;
  if (!data?.bySubject) return null;
  const sum = Object.values(data.bySubject).reduce((a, b) => a + b, 0);
  return Number.isFinite(sum) ? sum : null;
}

async function listTotal(path: string, key = 'total'): Promise<number | null> {
  const data = (await fetchJson(`${API_V1}${path}`)) as Record<string, unknown> | null;
  const total = data?.[key];
  return typeof total === 'number' ? total : null;
}

async function imageRiddleTotal(): Promise<number | null> {
  const data = (await fetchJson(`${API_V1}/image-riddles/stats/overview`)) as {
    totalRiddles?: number;
  } | null;
  return typeof data?.totalRiddles === 'number' ? data.totalRiddles : null;
}

const fmt = (n: number | null, fallback: string) =>
  n === null ? fallback : n.toLocaleString('en-US');

export default async function OpengraphImage(): Promise<ImageResponse> {
  const { seo } = await getPublicSettings();
  const siteName = seo?.siteName?.trim() || 'PigZap';

  const [quiz, riddles, jokes, imagePuzzles] = await Promise.all([
    quizTotal(),
    listTotal('/riddle-mcq?limit=1'),
    listTotal('/dad-jokes?limit=1'),
    imageRiddleTotal(),
  ]);

  const stat = (n: number | null, fb: string, label: string, last = false) => (
    <span style={{ display: 'flex' }}>
      <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', marginRight: 6 }}>
        {fmt(n, fb)}
      </span>
      <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,.95)' }}>{label}</span>
      {last ? null : (
        <span style={{ fontSize: 16, opacity: 0.55, margin: '0 10px', color: '#ffffff' }}>·</span>
      )}
    </span>
  );

  const bleed = {
    position: 'absolute' as const,
    opacity: 0.14,
    filter: 'drop-shadow(0 8px 14px rgba(30,20,80,.25))',
  };

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #A5A3E4 0%, #8f7fd8 45%, #BF7076 100%)',
        color: 'white',
        position: 'relative',
      }}
    >
      {/* decorative bleed emojis (cropped per platform, never near the safe zone) */}
      <div style={{ ...bleed, top: -20, left: -12, fontSize: 110, transform: 'rotate(-12deg)' }}>
        🧠
      </div>
      <div style={{ ...bleed, bottom: -24, right: -10, fontSize: 110, transform: 'rotate(10deg)' }}>
        🧩
      </div>
      <div style={{ ...bleed, top: 26, right: 170, fontSize: 66 }}>😂</div>
      <div style={{ ...bleed, bottom: 28, left: 150, fontSize: 66 }}>🖼️</div>

      {/* logo row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            background: '#3b2a86',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 58,
          }}
        >
          🐷
        </div>
        <div
          style={{
            fontSize: 92,
            fontWeight: 800,
            letterSpacing: -2,
            textShadow: '0 6px 18px rgba(30,20,80,.35)',
            display: 'flex',
          }}
        >
          {siteName}
        </div>
      </div>

      {/* five pillars */}
      <div
        style={{
          display: 'flex',
          fontSize: 27,
          fontWeight: 700,
          marginTop: 14,
          textShadow: '0 3px 10px rgba(30,20,80,.3)',
        }}
      >
        <span style={{ display: 'flex' }}>Quizzes</span>
        <span style={{ opacity: 0.55, margin: '0 12px' }}>·</span>
        <span style={{ display: 'flex' }}>Riddles</span>
        <span style={{ opacity: 0.55, margin: '0 12px' }}>·</span>
        <span style={{ display: 'flex' }}>Games</span>
        <span style={{ opacity: 0.55, margin: '0 12px' }}>·</span>
        <span style={{ display: 'flex' }}>Dad Jokes</span>
        <span style={{ opacity: 0.55, margin: '0 12px' }}>·</span>
        <span style={{ display: 'flex' }}>Image Puzzles</span>
      </div>

      {/* live totals — update automatically as content is added */}
      <div style={{ display: 'flex', marginTop: 8, alignItems: 'center' }}>
        {stat(quiz, '11,541', ' questions')}
        {stat(riddles, '3,000', ' riddles')}
        {stat(jokes, '1,013', ' jokes')}
        {stat(imagePuzzles, '1,906', ' image puzzles')}
        {stat(8, '8', ' games', true)}
      </div>

      {/* domain pill */}
      <div
        style={{
          marginTop: 16,
          padding: '8px 26px',
          borderRadius: 999,
          border: '1.5px solid rgba(255,255,255,.55)',
          background: 'rgba(17,20,56,.5)',
          fontSize: 23,
          fontWeight: 800,
          letterSpacing: 2,
          display: 'flex',
        }}
      >
        PIGZAP.COM
      </div>
    </div>,
    size
  );
}
