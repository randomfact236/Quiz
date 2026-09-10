import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';

import Footer from '@/components/Footer';
import { HideOnAdmin } from '@/components/HideOnAdmin';
import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import { NavigationProgress } from '@/components/NavigationProgress';
import { JsonLd } from '@/components/JsonLd';
import { SiteBrandProvider } from '@/components/SiteBrandContext';
import { siteJsonLd } from '@/lib/seo';
import { getPublicSettings, resolveMediaUrl } from '@/lib/public-settings';
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

export async function generateMetadata(): Promise<Metadata> {
  const { seo, site } = await getPublicSettings();
  // Site Information branding wins; the seo group is the fallback chain below it.
  const siteName = site?.siteName?.trim() || seo?.siteName?.trim() || DEFAULTS.siteName;
  const titleDefault = seo?.titleDefault?.trim() || DEFAULTS.titleDefault;
  const description =
    site?.siteDescription?.trim() || seo?.description?.trim() || DEFAULTS.description;
  const keywords = seo?.keywords && seo.keywords.length > 0 ? seo.keywords : DEFAULTS.keywords;
  const googleVerification = seo?.googleSiteVerification?.trim() || '';

  // Browser tab reads "Page | Tagline"; empty tagline keeps the seo template
  // (which itself falls back to "%s | <site name>").
  const tabTagline = site?.tabTagline?.trim() || '';
  const titleTemplate = tabTagline
    ? `%s | ${tabTagline}`
    : seo?.titleTemplate?.trim() || DEFAULTS.titleTemplate;

  // Favicon from settings replaces the file-convention icon.svg when set.
  const favicon = resolveMediaUrl(site?.favicon?.trim() ?? '');

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
      template: titleTemplate,
    },
    ...(favicon ? { icons: { icon: favicon } } : {}),
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
      // Only set `images` when configured — an always-present key (even with an
      // undefined value) blocks the file-convention opengraph-image from merging.
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: twTitle,
      description: twDescription,
      site: seo?.twitterHandle?.trim() || undefined,
      ...(twImage ? { images: [twImage] } : {}),
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
  const { seo, site } = await getPublicSettings();
  const brand = {
    siteName: site?.siteName?.trim() || seo?.siteName?.trim() || 'AI Quiz',
    logo: resolveMediaUrl(site?.logo?.trim() ?? ''),
    favicon: resolveMediaUrl(site?.favicon?.trim() ?? ''),
  };
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
        <JsonLd
          data={siteJsonLd({
            siteName: brand.siteName,
            description: site?.siteDescription?.trim() || seo?.description?.trim(),
            ogImageUrl: seo?.ogImageUrl,
            twitterHandle: seo?.twitterHandle,
            logo: brand.logo || undefined,
          })}
        />
        <SiteBrandProvider value={brand}>
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
            <main id="main-content" className="flex flex-col flex-1">
              {children}
            </main>
            <HideOnAdmin>
              <Footer />
              <MobileFooter />
            </HideOnAdmin>
          </Providers>
        </SiteBrandProvider>
      </body>
    </html>
  );
}
