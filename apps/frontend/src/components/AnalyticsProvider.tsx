'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useReportWebVitals } from 'next/web-vitals';

import { initAnalytics, track } from '@/lib/analytics';

/**
 * Analytics bootstrap (analytics plan Phase 3): attaches flush listeners,
 * emits `page_viewed` on every route change (plan §6.2 route popularity)
 * and reports Web Vitals (plan §6.2). Mounted once from Providers.
 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    track('page_viewed', { path: pathname }, { module: 'site' });
  }, [pathname]);

  useReportWebVitals((metric) => {
    // CLS is a unitless score — scale to match the others' integer format.
    const value =
      metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value);
    track('web_vitals', { metric: metric.name, value, rating: metric.rating }, { module: 'site' });
  });

  return null;
}
