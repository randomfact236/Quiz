'use client';

/**
 * ============================================================================
 * AnalyticsSection — tabbed admin analytics dashboard
 * ============================================================================
 * Dark full-dashboard UI (tabs per game module + audience/geo + retention +
 * raw events) fed by GET /admin/analytics/dashboard and /retention. Range
 * selector (24h/7d/30d/90d) re-fetches; the active tab deep-links through the
 * admin URL (?section=analytics&tab=…). CSV export is client-side from the
 * loaded payload.
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

import { adminApi, ApiError } from '@/lib/api-client';
import { EventsBrowser } from './EventsBrowser';
import { downloadCsv } from './analytics/csv';
import {
  exportRowsForTab,
  AudienceTab,
  ImageRiddlesTab,
  JokesTab,
  ModuleTab,
  OverviewTab,
  RetentionTab,
  UsersTab,
} from './analytics/tabs';
import type { AdminDashboard, RetentionCohort } from './analytics/types';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'quiz-mcq', label: 'Quiz MCQ' },
  { id: 'riddle-mcq', label: 'Riddle MCQ' },
  { id: 'image-riddles', label: 'Image Riddles' },
  { id: 'jokes', label: 'Dad Jokes' },
  { id: 'users', label: 'Users' },
  { id: 'audience', label: 'Audience & Geo' },
  { id: 'retention', label: 'Retention' },
  { id: 'events', label: 'Raw Events' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const RANGES = [
  { id: '1', label: '24h' },
  { id: '7', label: '7d' },
  { id: '30', label: '30d' },
  { id: '90', label: '90d' },
] as const;

export function AnalyticsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tab, setTab] = useState<TabId>(
    (TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? 'overview') as TabId
  );
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [retention, setRetention] = useState<RetentionCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (rangeDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const [dashboardRes, retentionRes] = await Promise.all([
        adminApi.get<AdminDashboard>(`/admin/analytics/dashboard?days=${rangeDays}`),
        adminApi.get<RetentionCohort[]>('/admin/analytics/retention?weeks=8'),
      ]);
      setData(dashboardRes.data);
      setRetention(Array.isArray(retentionRes.data) ? retentionRes.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const changeTab = (next: TabId) => {
    setTab(next);
    // Deep-link the tab without triggering a section-level navigation.
    const params = new URLSearchParams(searchParams.toString());
    params.set('section', 'analytics');
    params.set('tab', next);
    router.replace(`/admin?${params.toString()}`, { scroll: false });
  };

  const exportCsv = () => {
    if (!data) return;
    downloadCsv(`analytics-${tab}`, exportRowsForTab(tab, data, retention));
  };

  return (
    <div className="rounded-xl bg-gray-950 shadow-lg ring-1 ring-gray-800">
      {/* Header */}
      <div className="flex flex-col gap-3 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-cyan-400" /> Analytics
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Traffic, engagement and performance across every module
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            aria-label="Date range"
          >
            {RANGES.map((r) => (
              <option key={r.id} value={r.id}>
                Last {r.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            disabled={!data}
            className="flex items-center gap-1.5 rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-800 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          <button
            onClick={() => void load(days)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Tab strip — sticky within the admin scroll area */}
      <div className="sticky top-0 z-10 mt-4 bg-gray-950/95 px-5 pb-2 pt-1 backdrop-blur">
        <div className="flex gap-1 overflow-x-auto rounded-lg bg-gray-900/70 p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => changeTab(t.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.id
                  ? 'bg-gray-800 font-medium text-white shadow'
                  : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading && !data ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-cyan-500" />
            <p className="text-sm text-gray-500">Loading analytics…</p>
          </div>
        ) : error && !data ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <p className="text-sm text-rose-400">{error}</p>
            <button
              onClick={() => void load(days)}
              className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500"
            >
              Retry
            </button>
          </div>
        ) : data ? (
          <>
            {error && (
              <p className="mb-4 rounded-lg border border-amber-800/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                Refresh failed ({error}) — showing the last loaded data.
              </p>
            )}
            {tab === 'overview' && <OverviewTab data={data} />}
            {tab === 'quiz-mcq' && <ModuleTab data={data} moduleKey="quiz-mcq" />}
            {tab === 'riddle-mcq' && <ModuleTab data={data} moduleKey="riddle-mcq" />}
            {tab === 'image-riddles' && <ImageRiddlesTab data={data} />}
            {tab === 'jokes' && <JokesTab data={data} />}
            {tab === 'users' && <UsersTab data={data} />}
            {tab === 'audience' && <AudienceTab data={data} />}
            {tab === 'retention' && <RetentionTab cohorts={retention} />}
            {tab === 'events' && <EventsBrowser />}
          </>
        ) : null}
      </div>
    </div>
  );
}
