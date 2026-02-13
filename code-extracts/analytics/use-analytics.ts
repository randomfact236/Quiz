'use client';

import { useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  getSession,
  trackPageView,
  trackEvent,
  updateScrollDepth,
  calculateJourneyStats,
  type JourneyStats,
} from '@/lib/analytics/session-tracker';

interface UseAnalyticsReturn {
  trackClick: (name: string, data?: Record<string, unknown>) => void;
  trackAffiliateClick: (product: string, placement: string) => void;
  trackProductView: (productId: string, productName: string) => void;
  trackSearch: (query: string, resultsCount: number) => void;
  trackAddToCart: (product: string, price: number) => void;
  getStats: () => JourneyStats;
}

export function useAnalytics(): UseAnalyticsReturn {
  const pathname = usePathname();
  const scrollThrottleRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const title = document.title;
    trackPageView(pathname, title);
    getSession();
  }, [pathname]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => {
      const now = Date.now();
      if (now - scrollThrottleRef.current < 500) return;
      scrollThrottleRef.current = now;
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      updateScrollDepth(scrollPercent);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const trackClick = useCallback((name: string, data?: Record<string, unknown>) => {
    trackEvent('click', name, data);
  }, []);

  const trackAffiliateClick = useCallback((product: string, placement: string) => {
    trackEvent('click', 'affiliate_link', { product, placement, timestamp: Date.now() });
  }, []);

  const trackProductView = useCallback((productId: string, productName: string) => {
    trackEvent('page', 'product_view', { productId, productName });
  }, []);

  const trackSearch = useCallback((query: string, resultsCount: number) => {
    trackEvent('search', 'query', { query, resultsCount });
  }, []);

  const trackAddToCart = useCallback((product: string, price: number) => {
    trackEvent('ecommerce', 'add_to_cart', { product, price });
  }, []);

  const getStats = useCallback(() => {
    return calculateJourneyStats();
  }, []);

  return {
    trackClick,
    trackAffiliateClick,
    trackProductView,
    trackSearch,
    trackAddToCart,
    getStats,
  };
}

export function useTrackClick(elementName: string, data?: Record<string, unknown>) {
  const { trackClick } = useAnalytics();
  return useCallback(() => {
    trackClick(elementName, data);
  }, [trackClick, elementName, data]);
}

interface AnalyticsProviderProps {
  children: ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    getSession();
  }, []);
  return children;
}
