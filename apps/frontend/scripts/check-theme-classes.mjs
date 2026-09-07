#!/usr/bin/env node
/**
 * ============================================================================
 * Theme class guard
 * ============================================================================
 * Fails when a Tailwind class string uses a light-only utility (bg-white,
 * pastel backgrounds, dark gray text/borders…) without a `dark:` counterpart
 * in the same class string. This is the regression guard for the dark-mode
 * conversion: new UI must adapt, or the violation must be explicitly avoided
 * by using adaptive tokens (bg-card, text-foreground, …).
 *
 * Not flagged on purpose:
 *   - text-white / bg-white with alpha (bg-white/10) — translucent decoration
 *     over gradients and text on colored surfaces; correct in both modes
 *   - bg-black — modal scrims
 *   - from-/via-/to- gradient stops and colors ≥300 for text (light accents
 *     on dark-first surfaces, e.g. the admin sidebar)
 *   - hover:/focus:/placeholder:/group-hover: prefixes other than hover:
 *     (only hover: has a dedicated dark counterpart rule)
 *
 * Usage: node scripts/check-theme-classes.mjs   (exit 1 on violations)
 * ============================================================================
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'src');

const ACCENT =
  'indigo|purple|pink|rose|red|orange|amber|yellow|green|emerald|teal|cyan|sky|blue|violet|fuchsia|lime';
const NEUTRAL = 'gray|slate|zinc|neutral|stone';

/** property → regexes of light-only utilities that need a dark counterpart */
const RULES = [
  {
    prop: 'bg',
    // white and all light pastel/neutral backgrounds (no alpha modifier)
    re: new RegExp(
      `^bg-(?:(?:white)|(?:${NEUTRAL}|${ACCENT})-(?:50|100|200))$`
    ),
  },
  {
    prop: 'text',
    re: new RegExp(
      `^text-((?:${NEUTRAL})-(?:400|500|600|700|800|900)|black|(${ACCENT})-(?:600|700|800|900))$`
    ),
  },
  {
    prop: 'border',
    re: new RegExp(
      `^border-((?:${NEUTRAL}|${ACCENT})-(?:100|200|300))$`
    ),
  },
  { prop: 'ring', re: /^ring-(?:gray|slate)-(?:100|200|300)$/ },
  { prop: 'divide', re: /^divide-gray-(?:100|200|300)$/ },
];

/** className="...", className='...', className={`...`} */
function classSpans(src) {
  const spans = [];
  const tick = '`';
  for (const m of src.matchAll(/className\s*=\s*"([^"]*)"/g))
    spans.push([m.index + m[0].indexOf('"') + 1, m.index + m[0].length - 1]);
  for (const m of src.matchAll(/className\s*=\s*'([^']*)'/g))
    spans.push([m.index + m[0].indexOf("'") + 1, m.index + m[0].length - 1]);
  for (const m of src.matchAll(
    new RegExp(`className\\s*=\\s*\\{${tick}([^${tick}]*)${tick}`, 'g')
  ))
    spans.push([m.index + m[0].indexOf(tick) + 1, m.index + m[0].length - 1]);
  return spans.sort((a, b) => a[0] - b[0]);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (entry.endsWith('.tsx') && !entry.includes('.test.')) yield full;
  }
}

const violations = [];
let filesChecked = 0;

for (const file of walk(ROOT)) {
  filesChecked += 1;
  const rel = relative(ROOT, file).split(sep).join('/');
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  for (const [start, end] of classSpans(src)) {
    const seg = src.slice(start, end);
    const segLine = lines.slice(0, src.slice(0, start).split('\n').length).join('\n').length;
    const line = segLine === 0 ? 1 : src.slice(0, start).split('\n').length;
    void segLine;

    const tokens = seg.split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (token.startsWith('dark:') || token.includes('/')) continue; // counterpart or alpha
      const hoverless = token.replace(/^hover:/, '');
      for (const { prop, re } of RULES) {
        if (!re.test(hoverless)) continue;
        // counterpart: any dark:<prop>- (hover tokens need dark:hover:<prop>-)
        const need = token.startsWith('hover:')
          ? `dark:hover:${prop}-`
          : `dark:${prop}-`;
        if (tokens.some((t) => t.startsWith(need))) continue;
        violations.push({ rel, line, token, need });
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    `\n✖ theme class guard: ${violations.length} light-only utilit${
      violations.length === 1 ? 'y' : 'ies'
    } without a dark: counterpart\n`
  );
  let lastFile = '';
  for (const v of violations) {
    if (v.rel !== lastFile) {
      console.error(`  ${v.rel}`);
      lastFile = v.rel;
    }
    console.error(
      `    src/${v.rel}:${v.line}  ${v.token}  → add ${v.need}… or use adaptive tokens`
    );
  }
  console.error(
    `\nIf this utility is intentionally identical in both modes (e.g. text on a\n` +
      `colored surface), restructure it so the guard passes — e.g. move it next\n` +
      `to an existing dark: counterpart or use a token (bg-card, text-foreground).\n`
  );
  process.exit(1);
}

console.log(`✓ theme class guard: ${filesChecked} files, no light-only utilities without dark: counterparts`);
