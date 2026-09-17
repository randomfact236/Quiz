'use client';
import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

/**
 * The App Router prefetches <Link> targets, so most client navigations finish
 * in tens of milliseconds — start()/done() firing back-to-back makes the bar
 * invisible (BUG-014). Two tunings fix that without slowing anyone down:
 * navigations that complete within START_DELAY_MS never show the bar at all,
 * and once shown it stays up for at least MIN_DISPLAY_MS so finished loads
 * complete and fade instead of vanishing mid-frame.
 */
const START_DELAY_MS = 120;
const MIN_DISPLAY_MS = 450;
const SAFETY_TIMEOUT_MS = 10000;

NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
});

export function NavigationProgress(): null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const startTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef(0);

  const clearTimer = (ref: typeof startTimer): void => {
    if (ref.current !== null) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  };

  /** Schedule the bar for a navigation that is beginning right now. */
  const begin = (immediate: boolean): void => {
    if (NProgress.isStarted()) return;
    clearTimer(startTimer);
    startTimer.current = setTimeout(
      () => {
        startTimer.current = null;
        startedAt.current = Date.now();
        NProgress.start();
        clearTimer(safetyTimer);
        safetyTimer.current = setTimeout(() => {
          safetyTimer.current = null;
          NProgress.done();
        }, SAFETY_TIMEOUT_MS);
      },
      immediate ? 0 : START_DELAY_MS
    );
  };

  /** The navigation landed — let the bar finish gracefully, honoring the
   *  minimum display window instead of snapping away mid-frame. */
  const finish = (): void => {
    clearTimer(startTimer);
    clearTimer(safetyTimer);
    if (!NProgress.isStarted()) return;
    clearTimer(doneTimer);
    const wait = Math.max(0, MIN_DISPLAY_MS - (Date.now() - startedAt.current));
    doneTimer.current = setTimeout(() => {
      doneTimer.current = null;
      NProgress.done();
    }, wait);
  };

  // URL changed — the navigation completed.
  useEffect(() => {
    finish();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Respect modified clicks / new tabs / downloads — they never navigate
      // this document, so the bar must not start.
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.('a');
      if (
        !anchor ||
        !anchor.href ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download')
      ) {
        return;
      }
      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      begin(false);
    };

    // Back/forward navigations bypass anchor clicks entirely.
    const handlePopState = () => begin(true);

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
      clearTimer(startTimer);
      clearTimer(doneTimer);
      clearTimer(safetyTimer);
      NProgress.done();
    };
  }, []);

  return null;
}
