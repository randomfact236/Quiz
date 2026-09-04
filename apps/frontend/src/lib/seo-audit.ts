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

// ==================== Dashboard grouping (plan/15 SEO Dashboard) ====================

/** Content groups shown as breakdown cards + filter chips on the dashboard. */
export type SeoGroup = 'quiz' | 'riddles' | 'images' | 'jokes' | 'static';

export const SEO_GROUPS: { id: SeoGroup; label: string; emoji: string }[] = [
  { id: 'quiz', label: 'Quiz MCQ', emoji: '📚' },
  { id: 'riddles', label: 'Riddle MCQ', emoji: '🧩' },
  { id: 'images', label: 'Image Riddles', emoji: '🖼️' },
  { id: 'jokes', label: 'Dad Jokes', emoji: '😄' },
  { id: 'static', label: 'Static Pages', emoji: '📄' },
];

export function classifyRoute(path: string): SeoGroup {
  if (path.startsWith('/quiz-mcq')) return 'quiz';
  if (path.startsWith('/riddle-mcq')) return 'riddles';
  if (path.startsWith('/image-riddles')) return 'images';
  if (path.startsWith('/jokes')) return 'jokes';
  return 'static';
}

/** Cap the dynamic (query-param) URLs so the dashboard crawl stays bounded. */
const MAX_DYNAMIC_URLS = 30;

/**
 * Audit targets = the canonical landing routes + the dynamic subject/category
 * URLs found in the sitemap (deduped, capped). Group is attached for the
 * dashboard breakdown cards.
 */
export function buildAuditTargets(sitemapPaths: Set<string> | null): {
  path: string;
  label: string;
  group: SeoGroup;
}[] {
  const targets = AUDIT_ROUTES.map((r) => ({ ...r, group: classifyRoute(r.path) }));
  if (sitemapPaths) {
    const known = new Set(targets.map((t) => t.path));
    for (const p of sitemapPaths) {
      if (targets.length >= AUDIT_ROUTES.length + MAX_DYNAMIC_URLS) break;
      if (known.has(p) || !p.includes('?')) continue;
      known.add(p);
      const group = classifyRoute(p);
      const label = decodeURIComponent(p.split('?')[1] ?? '').slice(0, 40);
      targets.push({ path: p, label, group });
    }
  }
  return targets;
}

/** Concrete issues for a row — rendered as "Missing Fields" chips. */
export function rowIssues(row: SeoAuditRow): string[] {
  const issues: string[] = [];
  if (row.noindex) issues.push('Noindex');
  if (!row.title) issues.push('Title');
  else if (titleStatus(row.title) === 'warn') issues.push('Title length');
  if (!row.description) issues.push('Description');
  else if (descriptionStatus(row.description) === 'warn') issues.push('Description length');
  if (!row.ogImage) issues.push('OG Image');
  if (!row.jsonLd) issues.push('JSON-LD');
  if (row.inSitemap === false) issues.push('Sitemap');
  return issues;
}

export type SeoHealth = 'healthy' | 'warning' | 'critical';

export function rowHealth(row: SeoAuditRow): SeoHealth {
  const n = rowIssues(row).length;
  if (n === 0) return 'healthy';
  return n === 1 ? 'warning' : 'critical';
}
