/**
 * ============================================================================
 * deep-links.ts — readers for the per-item share URLs (BUG-064 follow-up)
 * ============================================================================
 * Both URL forms land on the section pages and must open the linked item:
 *   /image-riddles?riddle=<id>   legacy share links (pre-#8) → /image-riddles
 *   /image-riddles/<id>          per-riddle share URLs (SHARE-01 #8)
 *   /jokes?joke=<id>             legacy share links (pre-#9)      → /jokes
 *   /jokes/<id>                  per-joke share URLs (SHARE-01 #9)
 * Server-safe: returns null on the server so SSR renders the plain section.
 * ============================================================================
 */

const UUID_PATH_RE = (section: string): RegExp => new RegExp(`^/${section}/([0-9a-f-]{36})$`, 'i');

export function readImageRiddleDeepLinkId(): string | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('riddle');
  if (param) return param;
  return UUID_PATH_RE('image-riddles').exec(window.location.pathname)?.[1] ?? null;
}

export function readJokeDeepLinkId(): string | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('joke');
  if (param) return param;
  return UUID_PATH_RE('jokes').exec(window.location.pathname)?.[1] ?? null;
}
