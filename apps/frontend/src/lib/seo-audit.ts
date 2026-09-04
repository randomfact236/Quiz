/**
 * ============================================================================
 * seo-audit.ts — client-side SEO page audit (plan/15-seo.md, SeoSection "Pages")
 * ============================================================================
 * Crawls the key routes in the browser, parses the served HTML and reports
 * title/description quality, robots directives, OG image, JSON-LD presence
 * and sitemap membership. Kept framework-free so it is unit-testable.
 * ============================================================================
 */

export interface SeoAuditRow {
  path: string;
  label: string;
  title: string;
  description: string;
  noindex: boolean;
  ogImage: boolean;
  jsonLd: boolean;
  /** true/false per the live sitemap; null when the sitemap couldn't be read */
  inSitemap: boolean | null;
}

export const AUDIT_ROUTES: { path: string; label: string }[] = [
  { path: '/', label: 'Home' },
  { path: '/play', label: 'Play Hub' },
  { path: '/quiz-mcq', label: 'Quiz MCQ' },
  { path: '/riddle-mcq', label: 'Riddle MCQ' },
  { path: '/image-riddles', label: 'Image Riddles' },
  { path: '/jokes', label: 'Dad Jokes' },
  { path: '/achievements', label: 'Achievements' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/privacy', label: 'Privacy' },
  { path: '/terms', label: 'Terms' },
];

/** Fetch /sitemap.xml and reduce it to a set of crawlable paths. Null on failure. */
export async function loadSitemapPaths(): Promise<Set<string> | null> {
  try {
    const res = await fetch('/sitemap.xml');
    if (!res.ok) return null;
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
      .map((m) => m[1])
      .filter((u): u is string => typeof u === 'string');
    return new Set(
      locs.map((u) => {
        try {
          const p = new URL(u).pathname;
          return p === '' ? '/' : p;
        } catch {
          return u;
        }
      })
    );
  } catch {
    return null;
  }
}

/** Crawl one route and extract the SEO-relevant facts from the served HTML. */
export async function auditRoute(
  path: string,
  label: string,
  sitemapPaths: Set<string> | null
): Promise<SeoAuditRow> {
  try {
    const res = await fetch(path);
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title = doc.querySelector('title')?.textContent?.trim() ?? '';
    const description =
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ?? '';
    const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '';
    return {
      path,
      label,
      title,
      description,
      noindex: /noindex/i.test(robots),
      ogImage: doc.querySelector('meta[property="og:image"]') !== null,
      jsonLd: doc.querySelector('script[type="application/ld+json"]') !== null,
      inSitemap: sitemapPaths ? sitemapPaths.has(path === '/' ? '/' : path) : null,
    };
  } catch {
    return {
      path,
      label,
      title: '',
      description: '',
      noindex: false,
      ogImage: false,
      jsonLd: false,
      inSitemap: sitemapPaths ? false : null,
    };
  }
}

/** Title/description budget checks shared by the audit table status colors. */
export function titleStatus(title: string): 'ok' | 'warn' | 'fail' {
  if (!title) return 'fail';
  return title.length >= 30 && title.length <= 65 ? 'ok' : 'warn';
}

export function descriptionStatus(description: string): 'ok' | 'warn' | 'fail' {
  if (!description) return 'fail';
  return description.length >= 110 && description.length <= 165 ? 'ok' : 'warn';
}
