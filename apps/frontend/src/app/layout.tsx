import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';

import Footer from '@/components/Footer';
import { HideOnAdmin } from '@/components/HideOnAdmin';
import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import { NavigationProgress } from '@/components/NavigationProgress';
import { JsonLd } from '@/components/JsonLd';
import { siteJsonLd } from '@/lib/seo';
import type { SeoSettings } from '@/types/settings.types';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const APP_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3010';

/** Built-in metadata — the fallback whenever the backend or the seo group is unavailable. */
const DEFAULTS = {
  siteName: 'AI Quiz',
  titleDefault: 'AI Quiz - Interactive Learning Platform',
  titleTemplate: '%s | AI Quiz',
  description:
    'Enterprise-grade interactive quiz platform with science quizzes, dad jokes, riddles, and more. Test your knowledge and have fun!',
  keywords: [
    'quiz',
    'trivia',
    'science quiz',
    'dad jokes',
    'riddles',
    'learning',
    'education',
    'interactive',
  ],
};

/**
 * Site SEO metadata comes from the `seo` settings group (admin SeoSection →
 * PATCH /settings). Cached 5 min server-side; any failure falls back to the
 * built-ins above so the site never renders without metadata.
 */
async function getSeoSettings(): Promise<Partial<SeoSettings> | null> {
  const base = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3012/api';
  const apiRoot = base.endsWith('/v1') ? base : `${base}/v1`;
  try {
    const res = await fetch(`${apiRoot}/settings/public`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as { seo?: Partial<SeoSettings> };
    return data.seo ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  const siteName = seo?.siteName?.trim() || DEFAULTS.siteName;
  const titleDefault = seo?.titleDefault?.trim() || DEFAULTS.titleDefault;
  const description = seo?.description?.trim() || DEFAULTS.description;
  const keywords = seo?.keywords && seo.keywords.length > 0 ? seo.keywords : DEFAULTS.keywords;
  const googleVerification = seo?.googleSiteVerification?.trim() || '';

  // Fallback chain (plan/15-seo.md): page content → platform override →
  // global fallback → auto-generated image. Pages with their own metadata
  // (most content routes) already sit above this; these are the defaults.
  const fb = seo?.facebook;
  const tw = seo?.twitter;
  const ogTitle = fb?.title?.trim() || titleDefault;
  const ogDescription = fb?.description?.trim() || description;
  const ogImage = fb?.image?.trim() || seo?.ogImageUrl?.trim() || '';
  const twTitle = tw?.title?.trim() || titleDefault;
  const twDescription = tw?.description?.trim() || description;
  const twImage = tw?.image?.trim() || ogImage;
  const metaDescription = seo?.google?.description?.trim() || description;

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: titleDefault,
      template: seo?.titleTemplate?.trim() || DEFAULTS.titleTemplate,
    },
    description: metaDescription,
    keywords,
    authors: [{ name: `${siteName} Team` }],
    creator: `${siteName} Team`,
    publisher: `${siteName} Platform`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: APP_URL,
      siteName,
      title: ogTitle,
      description: ogDescription,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: twTitle,
      description: twDescription,
      site: seo?.twitterHandle?.trim() || undefined,
      images: twImage ? [twImage] : undefined,
    },
    verification: googleVerification ? { google: googleVerification } : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  // Same cached fetch as generateMetadata (Next dedupes it within the pass).
  const seo = await getSeoSettings();
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before first paint — the ThemeContext effect
            would otherwise leave dark-mode users with a light flash. Mirrors
            ThemeContext's resolution (stored | system). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ai-quiz-theme');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-white dark:bg-secondary-900 font-sans antialiased transition-colors duration-300">
        <JsonLd data={siteJsonLd(seo ?? {})} />
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <Header />
          <main className="flex flex-col flex-1">{children}</main>
          <HideOnAdmin>
            <Footer />
            <MobileFooter />
          </HideOnAdmin>
        </Providers>
      </body>
    </html>
  );
}
