'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

/**
 * Raw-events browser (plan/13-analytics.md P1 #3): paginated table over
 * `GET /admin/analytics/events` with eventName/module filters — for
 * debugging content/accuracy questions without DB access.
 */

interface AnalyticsEventRow {
  id: string;
  eventName: string;
  module: string | null;
  page: string | null;
  properties: Record<string, unknown> | null;
  serverTs: string | null;
}

const KNOWN_EVENT_NAMES = [
  'session_started',
  'session_resumed',
  'session_completed',
  'question_answered',
  'question_skipped',
  'achievement_unlocked',
  'joke_voted',
  'page_viewed',
  'web_vitals',
];

const KNOWN_MODULES = ['quiz-mcq', 'riddle-mcq', 'image-riddles', 'jokes', 'site', 'achievements'];

export function EventsBrowser(): JSX.Element {
  const [eventName, setEventName] = useState('');
  const [module, setModule] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AnalyticsEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const limit = 25;

  useEffect(() => {
    setIsLoading(true);
    setFailed(false);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (eventName) params.set('eventName', eventName);
    if (module) params.set('module', module);
    adminApi
      .get<{ data: AnalyticsEventRow[]; total: number }>(
        `/admin/analytics/events?${params.toString()}`
      )
      .then((response) => {
        setRows(response.data.data);
        setTotal(response.data.total);
      })
      .catch(() => setFailed(true))
      .finally(() => setIsLoading(false));
  }, [eventName, module, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-slate-200">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800">
        <Search className="h-5 w-5 text-indigo-500" /> Raw Events
      </h3>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={eventName}
          onChange={(e) => {
            setEventName(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          aria-label="Filter by event name"
        >
          <option value="">All event names</option>
          {KNOWN_EVENT_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          aria-label="Filter by module"
        >
          <option value="">All modules</option>
          {KNOWN_MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-slate-500">{total.toLocaleString()} events</span>
      </div>

      {failed && <p className="text-sm text-red-600">Could not load events. Is the API running?</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Event</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Module</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Time (server)</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-600">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                  No events match the filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-800">{row.eventName}</td>
                  <td className="px-3 py-2 text-slate-600">{row.module ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.serverTs ? new Date(row.serverTs).toLocaleString() : '—'}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 font-mono text-xs text-slate-500">
                    {row.properties ? JSON.stringify(row.properties) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-slate-300 px-2 py-1 disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
