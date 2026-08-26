'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

const SAFETY_TIMEOUT_MS = 10000;

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
});

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSafetyTimer = () => {
    if (safetyTimer.current !== null) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
  };

  useEffect(() => {
    clearSafetyTimer();
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor && anchor.href && !anchor.href.startsWith('#')) {
        clearSafetyTimer();
        NProgress.start();
        safetyTimer.current = setTimeout(() => {
          safetyTimer.current = null;
          NProgress.done();
        }, SAFETY_TIMEOUT_MS);
      }
    };
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearSafetyTimer();
    };
  }, []);

  return null;
}
