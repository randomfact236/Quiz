/**
 * ============================================================================
 * BRAND PLACEHOLDER MARK (SVG)
 * ============================================================================
 * Shown wherever a logo would appear but none is uploaded yet: the public
 * header, the mobile drawer, and the admin branding previews. Inline SVG so
 * it stays crisp and needs no asset. In "adaptive" tone the fill follows the
 * site's light/dark class (Tailwind dark: variants); the fixed tones are for
 * the admin side-by-side light/dark preview chips.
 */

export type BrandMarkTone = 'adaptive' | 'on-light' | 'on-dark';

const FIXED_TONES: Record<'on-light' | 'on-dark', { tile: string; glyph: string }> = {
  'on-light': { tile: '#2563eb', glyph: '#ffffff' },
  'on-dark': { tile: '#60a5fa', glyph: '#0f172a' },
};

export function BrandMark({
  size = 28,
  tone = 'adaptive',
  className = '',
}: {
  size?: number;
  tone?: BrandMarkTone;
  className?: string;
}): JSX.Element {
  const fixed = tone === 'adaptive' ? null : FIXED_TONES[tone];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="Placeholder logo"
      focusable="false"
      className={className}
    >
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="9"
        fill={fixed ? fixed.tile : undefined}
        className={fixed ? undefined : 'fill-primary-600 dark:fill-primary-400'}
      />
      <path
        d="M18.6 5.5 8.5 17.4h6L12.9 26.5 23.5 14h-6.4z"
        fill={fixed ? fixed.glyph : undefined}
        className={fixed ? undefined : 'fill-white dark:fill-secondary-900'}
      />
    </svg>
  );
}

export default BrandMark;
