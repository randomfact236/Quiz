import type { Metadata } from 'next';

import { NOINDEX } from '@/lib/seo';

// Gameplay surface — same noindex policy as the other play routes (plan/15).
export const metadata: Metadata = NOINDEX;

export default function DuelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
