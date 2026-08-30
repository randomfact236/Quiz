'use client';

/**
 * ============================================================================
 * AnalyticsSection — admin analytics dashboard (analytics plan Phase 4)
 * ============================================================================
 * Reads GET /admin/analytics/overview (+ /retention) via the adminApi client.
 * Charts are hand-rolled CSS bars — no chart library dependency (matches the
 * StatsSection approach on the public site).
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';

import { adminApi, ApiError } from '@/lib/api-client';

interface AdminOverview {
  totals: {
    events: number;
    eventsLast24h: number;
    registeredUsers: number;
    guestUsers: number;
  };
  activeUsers: { dau: number; wau: number; mau: number };
  sessionsCompletedByModule: { module: string; count: number }[];
  questionAccuracy: { module: string; answered: number; correct: number; accuracyPct: number }[];
  dailySeries: { day: string; events: number; activeUsers: number }[];
  topEvents: { eventName: string; count: number }[];
  topPages: { page: string; count: number }[];
  jokeVotes: { likes: number; dislikes: number };
}

interface RetentionCohort {
  cohortWeek: string;
  size: number;
  returned: number;
  retentionPct: number;
}

const MODULE_LABELS: Record<string, string> = {
  'quiz-mcq': 'Quiz MCQ',
  'riddle-mcq': 'Riddle MCQ',
  jokes: 'Dad Jokes',
  'image-riddles': 'Image Riddles',
  site: 'Site/Auth',
  unknown: 'Unattributed',
};

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 shadow dark:bg-secondary-900">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-secondary-400">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-secondary-100">{value}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function BarList({
  rows,
  formatLabel,
}: {
  rows: { label: string; value: number }[];
  formatLabel?: (label: string) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) {
    return <p className="text-sm text-gray-400">No data yet.</p>;
  }
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="mb-0.5 flex items-center justify-between text-xs text-gray-600 dark:text-secondary-300">
            <span className="truncate">{formatLabel ? formatLabel(row.label) : row.label}</span>
            <span className="ml-2 shrink-0 font-medium">{row.value.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-secondary-800">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow dark:bg-secondary-900">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-secondary-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function AnalyticsSection() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [retention, setRetention] = useState<RetentionCohort[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, retentionRes] = await Promise.all([
        adminApi.get<AdminOverview>('/admin/analytics/overview'),
        adminApi.get<RetentionCohort[]>('/admin/analytics/retention?weeks=8'),
      ]);
      setOverview(overviewRes.data);
      setRetention(Array.isArray(retentionRes.data) ? retentionRes.data : []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  if (loading && !overview) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-secondary-900">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-500" />
        <p className="mt-3 text-sm text-gray-500">Loading analytics…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow dark:bg-secondary-900">
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!overview) return null;

  const maxDaily = Math.max(1, ...overview.dailySeries.map((d) => d.events));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-secondary-100">
          <BarChart3 className="h-5 w-5" /> Analytics
        </h2>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 dark:border-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-800"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Top-line stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Events (24h)" value={overview.totals.eventsLast24h.toLocaleString()} />
        <StatCard label="Events (all)" value={overview.totals.events.toLocaleString()} />
        <StatCard label="DAU" value={overview.activeUsers.dau.toLocaleString()} />
        <StatCard label="WAU" value={overview.activeUsers.wau.toLocaleString()} />
        <StatCard label="Registered" value={overview.totals.registeredUsers.toLocaleString()} />
        <StatCard label="Guests" value={overview.totals.guestUsers.toLocaleString()} />
      </div>

      {/* Daily events chart (last 30 days) */}
      <Panel title="Events per day (30d)">
        <div className="flex h-32 items-end gap-[3px]">
          {overview.dailySeries.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.events} events, ${d.activeUsers} active users`}
              className="flex-1 rounded-t bg-indigo-500/80 hover:bg-indigo-400"
              style={{ height: `${Math.max(2, (d.events / maxDaily) * 100)}%` }}
            />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-xs text-gray-400">
          <span>{overview.dailySeries[0]?.day}</span>
          <span>{overview.dailySeries[overview.dailySeries.length - 1]?.day}</span>
        </div>
      </Panel>

      {/* Completions + accuracy */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Completed sessions by module">
          <BarList
            rows={overview.sessionsCompletedByModule.map((r) => ({
              label: r.module,
              value: r.count,
            }))}
            formatLabel={(l) => MODULE_LABELS[l] ?? l}
          />
        </Panel>
        <Panel title="Answer accuracy by module">
          {overview.questionAccuracy.length === 0 ? (
            <p className="text-sm text-gray-400">No answers tracked yet.</p>
          ) : (
            <div className="space-y-3">
              {overview.questionAccuracy.map((row) => (
                <div key={row.module}>
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-600 dark:text-secondary-300">
                    <span>{MODULE_LABELS[row.module] ?? row.module}</span>
                    <span className="font-medium">
                      {row.accuracyPct}% ({row.correct.toLocaleString()}/
                      {row.answered.toLocaleString()})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-secondary-800">
                    <div
                      className={`h-full rounded-full ${
                        row.accuracyPct >= 70
                          ? 'bg-emerald-500'
                          : row.accuracyPct >= 40
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.max(2, row.accuracyPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Engagement + funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Top events">
          <BarList rows={overview.topEvents.map((r) => ({ label: r.eventName, value: r.count }))} />
        </Panel>
        <Panel title="Top pages">
          <BarList rows={overview.topPages.map((r) => ({ label: r.page, value: r.count }))} />
        </Panel>
        <Panel title="Joke votes">
          <div className="space-y-2 text-sm text-gray-600 dark:text-secondary-300">
            <div className="flex justify-between">
              <span>Likes 👍</span>
              <span className="font-medium">{overview.jokeVotes.likes.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Dislikes 👎</span>
              <span className="font-medium">{overview.jokeVotes.dislikes.toLocaleString()}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* Retention cohorts */}
      <Panel title="Weekly retention cohorts (returned in a later week)">
        {retention.length === 0 ? (
          <p className="text-sm text-gray-400">Not enough history yet — check back next week.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="pb-2 pr-4">Cohort week</th>
                  <th className="pb-2 pr-4">New actors</th>
                  <th className="pb-2 pr-4">Returned</th>
                  <th className="pb-2">Retention</th>
                </tr>
              </thead>
              <tbody>
                {retention.map((c) => (
                  <tr
                    key={c.cohortWeek}
                    className="border-t border-gray-100 dark:border-secondary-800"
                  >
                    <td className="py-2 pr-4 text-gray-600 dark:text-secondary-300">
                      {c.cohortWeek}
                    </td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-secondary-300">{c.size}</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-secondary-300">
                      {c.returned}
                    </td>
                    <td className="py-2 font-medium text-gray-800 dark:text-secondary-100">
                      {c.retentionPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
