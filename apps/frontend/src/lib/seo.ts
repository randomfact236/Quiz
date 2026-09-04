/**
 * ============================================================================
 * seo.ts — shared SEO helpers (plan/15-seo.md)
 * ============================================================================
 * Single source for route metadata presets, noindex policy, and JSON-LD
 * builders. Route metadata exported from server layouts/pages imports from
 * here so titles/descriptions stay consistent with the `seo` settings group
 * consumed by the root layout's generateMetadata.
 * ============================================================================
 */

import type { Metadata } from 'next';

export const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3010';

/** For auth, gameplay-state and account pages: crawl the links, not the page. */
export const NOINDEX: Metadata = {
  robots: { index: false, follow: true },
};

/** Landing pages of the four game modules. */
export const MODULE_META: {
  'quiz-mcq': Metadata;
  'riddle-mcq': Metadata;
  play: Metadata;
  achievements: Metadata;
} = {
  'quiz-mcq': {
    title: 'Quiz MCQ — Interactive Knowledge Quizzes by Subject & Level',
    description:
      'Play multiple-choice quizzes across science, history, geography and more. Five difficulty levels, timed challenges, practice mode and instant scoring.',
    alternates: { canonical: '/quiz-mcq' },
    openGraph: {
      title: 'Quiz MCQ — Interactive Knowledge Quizzes',
      description:
        'Multiple-choice quizzes by subject and difficulty: timed challenges, practice mode, achievements.',
      type: 'website',
    },
  },
  'riddle-mcq': {
    title: 'Riddle MCQ — Brain Teasers by Category & Difficulty',
    description:
      'Solve multiple-choice riddles by category and difficulty. Resume anytime, track your streaks, and challenge the clock.',
    alternates: { canonical: '/riddle-mcq' },
    openGraph: {
      title: 'Riddle MCQ — Brain Teasers',
      description: 'Multiple-choice riddles by category and difficulty, with streaks and timers.',
      type: 'website',
    },
  },
  play: {
    title: 'Play Hub — Quizzes, Riddles, Jokes & Image Riddles',
    description:
      'Everything in one place: knowledge quizzes, brain-teaser riddles, dad jokes and visual puzzles. Pick a module and start playing.',
    alternates: { canonical: '/play' },
    openGraph: {
      title: 'Play Hub — Pick a Game',
      description: 'Quizzes, riddles, dad jokes and image riddles — all in one hub.',
      type: 'website',
    },
  },
  achievements: {
    title: 'Achievements — Unlock Badges as You Play',
    description:
      'Ten achievements to earn across quizzes and riddles: perfect scores, speed runs, streaks and more.',
    alternates: { canonical: '/achievements' },
    openGraph: {
      title: 'Achievements — Unlock Badges as You Play',
      description: 'Ten achievements to earn across quizzes and riddles.',
      type: 'website',
    },
  },
};

interface Crumb {
  name: string;
  path: string;
}

/** schema.org BreadcrumbList for the module landing pages. */
export function breadcrumbJsonLd(crumbs: Crumb[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${APP_URL}${c.path}`,
    })),
  };
}

/** Site-wide Organization + WebSite graph, built from the seo settings group. */
export function siteJsonLd(seo: {
  siteName?: string;
  description?: string;
  ogImageUrl?: string;
  twitterHandle?: string;
}): Record<string, unknown>[] {
  const name = seo.siteName?.trim() || 'AI Quiz';
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name,
      description: seo.description?.trim() || undefined,
      inLanguage: 'en',
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#organization`,
      name: `${name} Team`,
      url: APP_URL,
      ...(seo.ogImageUrl?.trim() ? { logo: seo.ogImageUrl.trim() } : {}),
      ...(seo.twitterHandle?.trim()
        ? { sameAs: [`https://twitter.com/${seo.twitterHandle.trim().replace(/^@/, '')}`] }
        : {}),
    },
  ];
  return [{ '@context': 'https://schema.org', '@graph': graph }];
}
