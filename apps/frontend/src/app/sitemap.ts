import type { MetadataRoute } from 'next';

const BASE_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3010';
const API_BASE = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';

/** Static, always-crawlable routes (plan/09-site-shell-seo.md P1). */
const STATIC_ROUTES: MetadataRoute.Sitemap = [
  '',
  '/quiz-mcq',
  '/riddle-mcq',
  '/image-riddles',
  '/jokes',
  '/play',
  '/about',
  '/login',
  '/register',
  '/privacy',
  '/terms',
  '/contact',
].map((path) => ({
  url: `${BASE_URL}${path}`,
  lastModified: new Date(),
  changeFrequency: 'weekly' as const,
  priority: path === '' ? 1 : 0.7,
}));

interface SlugEntry {
  slug?: string;
  id?: string;
}

async function fetchSlugs(path: string, key: 'slug' | 'id'): Promise<string[]> {
  try {
    const response = await fetch(`${API_BASE}/v1${path}`, {
      next: { revalidate: 3600 },
    });
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    const list: SlugEntry[] = Array.isArray(payload)
      ? payload
      : ((payload as { data?: SlugEntry[] })?.data ?? []);
    return list
      .map((entry) => entry[key])
      .filter((value): value is string => typeof value === 'string' && value.length > 0);
  } catch {
    // Sitemap must not fail the build when the API is unreachable.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [quizSubjects, riddleSubjects, imageCategories] = await Promise.all([
    fetchSlugs('/quiz-mcq/subjects', 'slug'),
    fetchSlugs('/riddle-mcq/subjects', 'slug'),
    fetchSlugs('/image-riddles/categories', 'id'),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...quizSubjects.map((slug) => ({
      url: `${BASE_URL}/quiz-mcq?subject=${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...riddleSubjects.map((slug) => ({
      url: `${BASE_URL}/riddle-mcq?subject=${slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...imageCategories.map((id) => ({
      url: `${BASE_URL}/image-riddles?category=${id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return [...STATIC_ROUTES, ...dynamicRoutes];
}
