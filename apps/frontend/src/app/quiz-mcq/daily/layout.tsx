import type { Metadata } from 'next';

import { NOINDEX } from '@/lib/seo';

// Gameplay surface: same noindex policy as the other quiz play routes
// (plan/15 metadata coverage).
export const metadata: Metadata = NOINDEX;

export default function DailyChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
