/**
 * ============================================================================
 * SEO audit helpers (plan/15-seo.md — SeoSection "Pages" tab)
 * ============================================================================
 * Covers the client-side crawler: sitemap path extraction, per-route meta
 * parsing (title/description/robots/og:image/JSON-LD), sitemap membership,
 * and the title/description length budgets.
 * ============================================================================
 */

import {
  AUDIT_ROUTES,
  auditRoute,
  buildAuditTargets,
  classifyRoute,
  descriptionStatus,
  loadSitemapPaths,
  rowHealth,
  rowIssues,
  titleStatus,
} from '@/lib/seo-audit';

const ORIGIN = 'http://localhost:3000';

function htmlDoc(body: string): string {
  return `<!doctype html><html><head>${body}</head><body></body></html>`;
}

/** jsdom's fetch/Response aren't fully available — stub the used surface. */
function mockFetchOnce(payload: string | Error): void {
  const stub = async () => ({
    ok: true,
    text: async () => payload,
  });
  global.fetch = (payload instanceof Error
    ? jest.fn().mockRejectedValue(payload)
    : jest.fn().mockImplementation(stub)) as unknown as typeof fetch;
}

describe('loadSitemapPaths', () => {
  it('extracts paths, strips the origin and maps the homepage to /', async () => {
    mockFetchOnce(
      `<urlset><url><loc>${ORIGIN}/</loc></url><url><loc>${ORIGIN}/quiz-mcq</loc></url></urlset>`
    );
    const paths = await loadSitemapPaths();
    expect(paths).not.toBeNull();
    expect(paths?.has('/')).toBe(true);
    expect(paths?.has('/quiz-mcq')).toBe(true);
    expect(paths?.has('/jokes')).toBe(false);
  });

  it('returns null when the sitemap is unreachable', async () => {
    mockFetchOnce(new Error('down'));
    await expect(loadSitemapPaths()).resolves.toBeNull();
  });
});

describe('auditRoute', () => {
  const sitemap = new Set(['/', '/quiz-mcq']);

  it('extracts meta facts from served HTML', async () => {
    mockFetchOnce(
      htmlDoc(
        '<title>Quiz MCQ — Interactive Quizzes</title>' +
          '<meta name="description" content="Play quizzes by subject and level." />' +
          '<meta property="og:image" content="http://x/og.png" />' +
          '<script type="application/ld+json">{"@type":"BreadcrumbList"}</script>'
      )
    );
    const row = await auditRoute('/quiz-mcq', 'Quiz MCQ', sitemap);
    expect(row.title).toBe('Quiz MCQ — Interactive Quizzes');
    expect(row.description).toBe('Play quizzes by subject and level.');
    expect(row.noindex).toBe(false);
    expect(row.ogImage).toBe(true);
    expect(row.jsonLd).toBe(true);
    expect(row.inSitemap).toBe(true);
  });

  it('flags noindex and missing sitemap membership', async () => {
    mockFetchOnce(htmlDoc('<title>t</title><meta name="robots" content="noindex, follow" />'));
    const row = await auditRoute('/jokes', 'Dad Jokes', sitemap);
    expect(row.noindex).toBe(true);
    expect(row.inSitemap).toBe(false);
    expect(row.ogImage).toBe(false);
  });

  it('returns a failing row when the route cannot be fetched', async () => {
    mockFetchOnce(new Error('down'));
    const row = await auditRoute('/jokes', 'Dad Jokes', null);
    expect(row.title).toBe('');
    expect(row.inSitemap).toBeNull();
  });
});

describe('length budgets', () => {
  it('titles: fail when missing, ok in 30–65, warn outside', () => {
    expect(titleStatus('')).toBe('fail');
    expect(titleStatus('a'.repeat(40))).toBe('ok');
    expect(titleStatus('a'.repeat(10))).toBe('warn');
    expect(titleStatus('a'.repeat(80))).toBe('warn');
  });

  it('descriptions: fail when missing, ok in 110–165, warn outside', () => {
    expect(descriptionStatus('')).toBe('fail');
    expect(descriptionStatus('d'.repeat(140))).toBe('ok');
    expect(descriptionStatus('d'.repeat(50))).toBe('warn');
    expect(descriptionStatus('d'.repeat(200))).toBe('warn');
  });
});

describe('AUDIT_ROUTES', () => {
  it('covers the indexable landing pages only', () => {
    const paths = AUDIT_ROUTES.map((r) => r.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/quiz-mcq');
    expect(paths).not.toContain('/login');
    expect(paths).not.toContain('/quiz-mcq/play');
  });
});

describe('dashboard grouping (SEO Dashboard)', () => {
  it('classifies routes into content groups', () => {
    expect(classifyRoute('/quiz-mcq')).toBe('quiz');
    expect(classifyRoute('/quiz-mcq?subject=science')).toBe('quiz');
    expect(classifyRoute('/riddle-mcq?subject=x')).toBe('riddles');
    expect(classifyRoute('/image-riddles?category=1')).toBe('images');
    expect(classifyRoute('/jokes')).toBe('jokes');
    expect(classifyRoute('/about')).toBe('static');
  });

  it('builds audit targets from static routes + sitemap query URLs (capped)', () => {
    const sitemap = new Set(['/quiz-mcq?subject=science', '/riddle-mcq?subject=logic', '/']);
    const targets = buildAuditTargets(sitemap);
    const paths = targets.map((t) => t.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/quiz-mcq?subject=science');
    expect(paths).toContain('/riddle-mcq?subject=logic');
    // static routes are not duplicated
    expect(paths.filter((p) => p === '/')).toHaveLength(1);
    expect(targets.every((t) => t.group)).toBe(true);
  });

  it('caps dynamic targets to keep the crawl bounded', () => {
    const many = new Set(Array.from({ length: 80 }, (_, i) => `/quiz-mcq?subject=s${i}`));
    const targets = buildAuditTargets(many);
    expect(targets.length).toBeLessThanOrEqual(AUDIT_ROUTES.length + 30);
  });

  it('computes issues + health from an audit row', () => {
    const healthy = {
      path: '/',
      label: 'Home',
      title: 'a'.repeat(40),
      description: 'd'.repeat(140),
      noindex: false,
      ogImage: true,
      jsonLd: true,
      inSitemap: true,
    };
    expect(rowIssues(healthy)).toEqual([]);
    expect(rowHealth(healthy)).toBe('healthy');

    const warn = { ...healthy, title: 'short' };
    expect(rowIssues(warn)).toEqual(['Title length']);
    expect(rowHealth(warn)).toBe('warning');

    const critical = { ...healthy, title: '', description: '', ogImage: false };
    expect(rowIssues(critical)).toEqual(['Title', 'Description', 'OG Image']);
    expect(rowHealth(critical)).toBe('critical');
  });
});
