/**
 * ============================================================================
 * share-templates.tsx — satori-safe renderers for the share-design system
 * ============================================================================
 * The one master-image family from `designs/share-design-system-report.md`
 * (WP0/WP1): 1200×630, family gradient, content inside the central safe zone.
 * Pure style + JSX only — no hooks, no client/server APIs — so route handlers
 * and the file-convention OG images can share the exact same rendering.
 * Satori constraints: flexbox only (no CSS grid), no shorthand positioning.
 * ============================================================================
 */

export const OG_1200x630 = { width: 1200, height: 630 };
export const OG_1200x600 = { width: 1200, height: 600 };

export type OgFamily = 'quiz' | 'riddle' | 'joke';

const FAMILY_GRADIENT: Record<OgFamily, string> = {
  quiz: 'linear-gradient(135deg, #A5A3E4 0%, #8f7fd8 45%, #BF7076 100%)',
  riddle: 'linear-gradient(135deg, #2dd4bf 0%, #0369a1 100%)',
  joke: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
};

const PILLARS = ['Quizzes', 'Riddles', 'Dad Jokes', 'Image Puzzles', 'Games'];

function Canvas({ family, children }: { family: OgFamily; children: React.ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: FAMILY_GRADIENT[family],
        color: '#ffffff',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

/** Option pills mirror the site's AnswerOptions grid: 2 → 2-up · 3 → row ·
 *  4 → 2×2 (wrap at ~46% width) · open-ended → none. Correct never marked. */
function OptionPills({ options }: { options: string[] }) {
  if (options.length === 0) return null;
  const width = options.length === 3 ? '30%' : '46%';
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 14,
        width: '86%',
      }}
    >
      {options.map((option, index) => (
        <div
          key={`${index}-${option}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(17,20,56,0.38)',
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: 14,
            padding: '10px 18px',
            width,
            fontSize: 26,
            fontWeight: 600,
            textAlign: 'left',
          }}
        >
          <span
            style={{
              display: 'flex',
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.92)',
              color: '#1e1b4b',
              fontWeight: 800,
              fontSize: 24,
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {String.fromCharCode(65 + index)}
          </span>
          <span style={{ overflow: 'hidden' }}>{option}</span>
        </div>
      ))}
    </div>
  );
}

/** Subject/category share (§3 #2/#5): big emoji + "<Name> — <line>" + hook. */
export function SubjectShareImage({
  family,
  emoji,
  title,
  hook,
}: {
  family: OgFamily;
  emoji: string;
  title: string;
  hook: string;
}) {
  return (
    <Canvas family={family}>
      <div style={{ fontSize: 150, lineHeight: 1.1 }}>{emoji}</div>
      <div style={{ marginTop: 20, fontSize: 62, fontWeight: 800, width: '88%' }}>{title}</div>
      <div style={{ marginTop: 18, fontSize: 28, opacity: 0.88 }}>{hook}</div>
    </Canvas>
  );
}

/** Question share (§3 #3/#6): chip + real question + real options, answer
 *  never shown. Question font shrinks as the text grows. */
export function QuestionShareImage({
  family,
  chip,
  question,
  options,
  hook,
}: {
  family: OgFamily;
  chip: string;
  question: string;
  options: string[];
  hook: string;
}) {
  const questionSize = question.length > 150 ? 38 : question.length > 90 ? 46 : 54;
  return (
    <Canvas family={family}>
      <div
        style={{
          position: 'absolute',
          top: 44,
          left: 56,
          display: 'flex',
          background: 'rgba(17,20,56,0.6)',
          borderRadius: 999,
          padding: '8px 24px',
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        {chip}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 30,
          width: '90%',
        }}
      >
        <div style={{ fontSize: questionSize, fontWeight: 800, lineHeight: 1.25, width: '100%' }}>
          {question}
        </div>
        <OptionPills options={options} />
        <div style={{ fontSize: 26, opacity: 0.88 }}>{hook}</div>
      </div>
    </Canvas>
  );
}

/** Result share (§3 #4/#7): big score badge + emoji + name + taunt hook. */
export function ResultShareImage({
  family,
  score,
  total,
  emoji,
  name,
  hook,
}: {
  family: OgFamily;
  score: number;
  total: number;
  emoji: string;
  name: string;
  hook: string;
}) {
  // Satori requires string children — raw numbers crash the render.
  const scoreLine = `${score}/${total}`;
  return (
    <Canvas family={family}>
      <div style={{ fontSize: 200, fontWeight: 900, lineHeight: 1 }}>{scoreLine}</div>
      <div style={{ fontSize: 60, marginTop: 10 }}>{emoji}</div>
      <div style={{ fontSize: 50, fontWeight: 800, marginTop: 8 }}>{name}</div>
      <div style={{ fontSize: 28, opacity: 0.9, marginTop: 14 }}>{hook}</div>
    </Canvas>
  );
}

/** Joke share (§3 #9): amber family template (the payload carries the joke). */
export function JokeShareImage({ setup }: { setup?: string | undefined } = {}) {
  const jokeLine = (setup ?? '').trim().slice(0, 120);
  return (
    <Canvas family="joke">
      <div style={{ fontSize: jokeLine ? 110 : 150, lineHeight: 1.1 }}>😂</div>
      <div style={{ marginTop: 18, fontSize: jokeLine ? 54 : 66, fontWeight: 800 }}>Dad Jokes</div>
      <div style={{ marginTop: 12, fontSize: jokeLine ? 40 : 34, fontWeight: 600, opacity: 0.95 }}>
        {jokeLine || 'laugh out loud - new one every day'}
      </div>
      <div style={{ marginTop: 18, fontSize: 26, opacity: 0.88 }}>pigzap.com/jokes</div>
    </Canvas>
  );
}

/** Home master template (WP0): icon + wordmark + pillars + LIVE stats +
 *  domain pill, decorative bleed emojis outside the safe zone. */
export function HomeShareImage({
  siteName,
  stats,
  height,
  iconSrc,
}: {
  siteName: string;
  stats: Array<{ value: string; label: string }>;
  height: number;
  /** The real pig icon as a PNG data URL (satori cannot render the SVG logo). */
  iconSrc?: string | null;
}) {
  const compact = height < 630; // X's 1200×600 crop tightens vertical rhythm
  return (
    <Canvas family="quiz">
      <div
        style={{
          position: 'absolute',
          top: -40,
          left: -20,
          fontSize: 170,
          transform: 'rotate(-14deg)',
          opacity: 0.14,
          display: 'flex',
        }}
      >
        🧠
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: -50,
          right: -20,
          fontSize: 170,
          transform: 'rotate(12deg)',
          opacity: 0.14,
          display: 'flex',
        }}
      >
        🧩
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {iconSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconSrc} width={112} height={112} alt="" />
        ) : (
          <div style={{ fontSize: 112, lineHeight: 1 }}>🐷</div>
        )}
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2 }}>{siteName}</div>
      </div>
      <div style={{ marginTop: compact ? 12 : 20, display: 'flex', gap: 12 }}>
        {PILLARS.map((pillar, index) => (
          <div key={pillar} style={{ display: 'flex', gap: 12, fontSize: 30, fontWeight: 700 }}>
            {index > 0 && <span style={{ opacity: 0.55 }}>·</span>}
            <span>{pillar}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: compact ? 10 : 16, display: 'flex', gap: 14 }}>
        {stats.map((stat, index) => (
          <div key={stat.label} style={{ display: 'flex', gap: 14, fontSize: 19 }}>
            {index > 0 && <span style={{ opacity: 0.55 }}>·</span>}
            <span>
              <span style={{ fontWeight: 900, fontSize: 21, marginRight: 6 }}>{stat.value}</span>
              <span style={{ fontWeight: 600, opacity: 0.95 }}>{stat.label}</span>
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: compact ? 16 : 26,
          display: 'flex',
          background: 'rgba(17,20,56,0.5)',
          border: '1.5px solid rgba(255,255,255,0.55)',
          borderRadius: 999,
          padding: '8px 30px',
          fontSize: 24,
          fontWeight: 800,
          letterSpacing: 2,
        }}
      >
        PIGZAP.COM
      </div>
    </Canvas>
  );
}
