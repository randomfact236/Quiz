import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import Footer from '@/components/Footer';
import Header from '@/components/Header';
import MobileFooter from '@/components/MobileFooter';
import { ThemeProvider } from '@/contexts/ThemeContext';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AI Quiz - Interactive Learning Platform',
    template: '%s | AI Quiz',
  },
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
  authors: [{ name: 'AI Quiz Team' }],
  creator: 'AI Quiz Team',
  publisher: 'AI Quiz Platform',
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
    url: 'https://aiquiz.com',
    siteName: 'AI Quiz Platform',
    title: 'AI Quiz - Interactive Learning Platform',
    description: 'Test your knowledge with interactive quizzes, dad jokes, and riddles!',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Quiz - Interactive Learning Platform',
    description: 'Test your knowledge with interactive quizzes, dad jokes, and riddles!',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-white dark:bg-secondary-900 font-sans antialiased transition-colors duration-300">
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-primary-600 focus:px-4 focus:py-2 focus:text-white"
          >
            Skip to main content
          </a>
          <Header />
          <div className="flex-1">{children}</div>
          <Footer />
          <MobileFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}