'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { ToastContainer } from '@/components/ui/ToastContainer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider />
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
      {/* Global toast outlet (plan/09 P0): every toast.success/error/... call
          renders here. Mounted once, above the app tree. */}
      <ToastContainer />
    </QueryClientProvider>
  );
}
