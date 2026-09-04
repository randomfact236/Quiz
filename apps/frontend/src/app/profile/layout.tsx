import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { NOINDEX } from '@/lib/seo';

// Gameplay-state, auth and account pages are crawl-noise (plan/15-seo.md P1).
export const metadata: Metadata = NOINDEX;

export default function ProfileLayout({ children }: { children: ReactNode }): JSX.Element {
  return <>{children}</>;
}
