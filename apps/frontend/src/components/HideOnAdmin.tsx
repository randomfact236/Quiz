'use client';

import { usePathname } from 'next/navigation';

/**
 * Renders its children only outside /admin routes. The admin shell has its
 * own header/footer chrome, so the public footer (with the newsletter form)
 * and the mobile bottom nav must not appear there.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }): JSX.Element | null {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  return <>{children}</>;
}
