import type { MetadataRoute } from 'next';

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3010';
const API_BASE = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';

/**
 * Static, always-crawlable routes (plan/15-seo.md P1). Auth pages are absent:
 * they are noindex (see the noindex layouts), and a sitemap entry pointing at
 * a noindex page sends crawlers mixed signals.
 */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { path: '', priority: 1, freq: 'daily' as const },
  { path: '/play', priority: 0.9, freq: 'weekly' as const },
  { path: '/quiz-mcq', priority: 0.8, freq: 'weekly' as const },
  { path: '/riddle-mcq', priority: 0.8, freq: 'weekly' as const },
  { path: '/image-riddles', priority: 0.8, freq: 'weekly' as const },
  { path: '/jokes', priority: 0.8, freq: 'daily' as const },
  { path: '/achievements', priority: 0.6, freq: 'weekly' as const },
  { path: '/about', priority: 0.5, freq: 'monthly' as const },
  { path: '/privacy', priority: 0.3, freq: 'yearly' as const },
  { path: '/terms', priority: 0.3, freq: 'yearly' as const },
  { path: '/contact', priority: 0.3, freq: 'monthly' as const },
].map(({ path, priority, freq }) => ({
  url: `${BASE_URL}${path}`,
  lastModified: new Date(),
  changeFrequency: freq,
  priority,
}));

interface SlugEntry {
  slug?: string;
  id?: string;
  updatedAt?: string;
}

interface DynamicRoute {
  url: string;
  lastModified?: Date;
}

async function fetchSections(path: string): Promise<DynamicRoute[]> {
  try {
    const response = await fetch(`${API_BASE}/v1${path}`, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    const list: SlugEntry[] = Array.isArray(payload)
      ? payload
      : ((payload as { data?: SlugEntry[] })?.data ?? []);
    const sections = list.map((entry): DynamicRoute | null => {
      const key = entry.slug ?? entry.id;
      if (typeof key !== 'string' || key.length === 0) return null;
      const updatedAt =
        typeof entry.updatedAt === 'string' && !Number.isNaN(Date.parse(entry.updatedAt))
          ? new Date(entry.updatedAt)
          : undefined;
      return { url: key, ...(updatedAt ? { lastModified: updatedAt } : {}) };
    });
    return sections.filter((entry): entry is DynamicRoute => entry !== null);
  } catch {
    // Sitemap must not fail the build when the API is unreachable.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [quizSubjects, riddleSubjects, imageCategories] = await Promise.all([
    fetchSections('/quiz-mcq/subjects'),
    fetchSections('/riddle-mcq/subjects'),
    fetchSections('/image-riddles/categories'),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...quizSubjects.map((s) => ({
      url: `${BASE_URL}/quiz-mcq?subject=${s.url}`,
      ...(s.lastModified ? { lastModified: s.lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...riddleSubjects.map((s) => ({
      url: `${BASE_URL}/riddle-mcq?subject=${s.url}`,
      ...(s.lastModified ? { lastModified: s.lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...imageCategories.map((s) => ({
      url: `${BASE_URL}/image-riddles?category=${s.url}`,
      ...(s.lastModified ? { lastModified: s.lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return [...STATIC_ROUTES, ...dynamicRoutes];
}
