import type { MetadataRoute } from 'next';

import { APP_URL, INDEXABLE_ROUTES } from '@/lib/seo';
import { chapterSlug } from '@/lib/slug';

// NEXT_PUBLIC_API_URL may or may not carry the /v1 suffix depending on the
// deployment (prod: …/api/v1, local default: …/api) — normalize so appending
// /v1 below never produces a double prefix (prod shipped exactly that bug,
// silently emptying the sitemap's dynamic section).
const API_BASE = (process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api')
  .replace(/\/v1\/?$/, '')
  .replace(/\/$/, '');

/**
 * Static, always-crawlable routes derived from the shared indexable-route
 * registry (lib/seo.ts) so the sitemap and the admin SEO audit can never
 * drift apart. Auth pages are absent: they are noindex (see the noindex
 * layouts), and a sitemap entry pointing at a noindex page sends crawlers
 * mixed signals.
 */
const STATIC_ROUTES: MetadataRoute.Sitemap = INDEXABLE_ROUTES.map(({ path, priority, freq }) => ({
  url: `${APP_URL}${path}`,
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

/**
 * Chapters of one quiz subject (NOW-03 per-chapter landings). Chapter URL
 * slugs derive from the name (lib/slug.ts — same derivation as the pages
 * and the middleware validation). Fails empty like fetchSections.
 */
async function fetchQuizChapters(subjectSlug: string): Promise<DynamicRoute[]> {
  try {
    const response = await fetch(
      `${API_BASE}/v1/quiz-mcq/subjects/${encodeURIComponent(subjectSlug)}`,
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) return [];
    const payload: unknown = await response.json();
    const chapters = (payload as { chapters?: unknown })?.chapters;
    if (!Array.isArray(chapters)) return [];
    return chapters
      .map((chapter): DynamicRoute | null => {
        const name = (chapter as { name?: unknown })?.name;
        // Carry "<subject>/<chapter-slug>" so the caller can build the URL.
        return typeof name === 'string' && name
          ? { url: `${subjectSlug}/${chapterSlug(name)}` }
          : null;
      })
      .filter((entry): entry is DynamicRoute => entry !== null);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [quizSubjects, riddleCategories, imageCategories] = await Promise.all([
    fetchSections('/quiz-mcq/subjects'),
    fetchSections('/riddle-mcq/categories'),
    fetchSections('/image-riddles/categories'),
  ]);

  // NOW-03: /quiz-mcq/<subject>/<chapter> landings — 79 chapters, all with
  // descriptive names; each resolves server-side with its own canonical.
  const quizChapterRoutes = (
    await Promise.all(quizSubjects.map((s) => fetchQuizChapters(s.url)))
  ).flat();

  const dynamicRoutes: MetadataRoute.Sitemap = [
    // plan/15 P2: real path segments — /quiz-mcq/<subject> and /riddle-mcq/<category>
    // are server-rendered landings with their own metadata/canonicals, so the
    // sitemap can point at them directly. (The riddle section previously emitted
    // /riddle-mcq?subject=<slug> — the riddle hub never read that param, so those
    // entries all resolved to the plain hub.)
    ...quizSubjects.map((s) => ({
      url: `${APP_URL}/quiz-mcq/${s.url}`,
      ...(s.lastModified ? { lastModified: s.lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...quizChapterRoutes.map((s) => ({
      url: `${APP_URL}/quiz-mcq/${s.url}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
    ...riddleCategories.map((s) => ({
      url: `${APP_URL}/riddle-mcq/${s.url}`,
      ...(s.lastModified ? { lastModified: s.lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    // Image-riddle categories keep their query-param URLs: the filters hook
    // reads and URL-syncs ?category=, so those pages work and stay canonical.
    ...imageCategories.map((s) => ({
      url: `${APP_URL}/image-riddles?category=${s.url}`,
      ...(s.lastModified ? { lastModified: s.lastModified } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return [...STATIC_ROUTES, ...dynamicRoutes];
}
