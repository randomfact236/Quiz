'use client';

import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';

/** Legacy key no code has read or written since the two-key quiz-resume
 * refactor — leftover sessions (days old) linger in visitors' storage. */
const LEGACY_CURRENT_SESSION_KEY = 'aiquiz:current-session';

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      window.localStorage.removeItem(LEGACY_CURRENT_SESSION_KEY);
    } catch {
      /* storage unavailable — nothing to clean */
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <AnalyticsProvider />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
        {/* Global toast outlet (plan/09 P0): every toast.success/error/... call
            renders here. Mounted once, above the app tree. */}
        <ToastContainer />
      </MotionConfig>
    </QueryClientProvider>
  );
}
