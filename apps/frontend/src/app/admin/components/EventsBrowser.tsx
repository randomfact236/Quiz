'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Search, UserSearch, X } from 'lucide-react';
import { adminApi } from '@/lib/api-client';

/**
 * Raw-events browser (plan/13-analytics.md P1 #3, filters §4b B4): visual
 * table over `GET /admin/analytics/events` — color-coded event badges,
 * human-readable detail chips, and eventName/module/date-range/actor filters.
 * Clicking an actor cell opens their chronological journey timeline
 * (properties rendered as chips, grouped per session).
 */

interface AnalyticsEventRow {
  id: string;
  eventName: string;
  module: string | null;
  page: string | null;
  userId: string | null;
  guestId: string | null;
  sessionId: string | null;
  properties: Record<string, unknown> | null;
  serverTs: string | null;
}

const KNOWN_EVENT_NAMES = [
  // client
  'session_started',
  'session_resumed',
  'session_completed',
  'session_abandoned',
  'session_extended',
  'question_answered',
  'question_skipped',
  'hint_used',
  'achievement_unlocked',
  'signup_completed',
  'joke_viewed',
  'joke_shared',
  'image_riddle_answer_checked',
  'image_riddle_hint_shown',
  'image_riddle_gave_up',
  'page_viewed',
  'web_vitals',
  'client_error',
  'api_failed',
  // server
  'user_registered',
  'user_login',
  'login_failed',
  'login_locked',
  'password_reset_requested',
  'password_reset_completed',
  'joke_voted',
  'comment_posted',
  'newsletter_subscribed',
  'newsletter_unsubscribed',
  'settings_updated',
];

const KNOWN_MODULES = ['quiz-mcq', 'riddle-mcq', 'image-riddles', 'jokes', 'site', 'achievements'];

const inputClass =
  'rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500';
const selectClass = inputClass;

/** Short id for the actor column — enough to eyeball, full value filters. */
function shortId(value: string | null): string {
  return value ? value.slice(0, 8) : '—';
}

/** Color-coded badge per event family — the at-a-glance event taxonomy. */
function eventBadgeClass(name: string): string {
  if (name === 'session_completed') return 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30';
  if (name === 'session_abandoned') return 'bg-rose-500/15 text-rose-300 ring-rose-500/30';
  if (name === 'session_started' || name === 'session_resumed' || name === 'session_extended')
    return 'bg-cyan-500/15 text-cyan-300 ring-cyan-500/30';
  if (name.startsWith('question_') || name === 'hint_used' || name.startsWith('image_riddle'))
    return 'bg-violet-500/15 text-violet-300 ring-violet-500/30';
  if (name === 'achievement_unlocked') return 'bg-amber-500/15 text-amber-300 ring-amber-500/30';
  if (name.startsWith('joke')) return 'bg-lime-500/15 text-lime-300 ring-lime-500/30';
  if (
    name === 'client_error' ||
    name === 'api_failed' ||
    name.startsWith('login_failed') ||
    name === 'login_locked'
  )
    return 'bg-red-500/15 text-red-300 ring-red-500/30';
  if (name === 'signup_completed' || name === 'user_registered' || name === 'user_login')
    return 'bg-sky-500/15 text-sky-300 ring-sky-500/30';
  if (name === 'page_viewed') return 'bg-blue-500/10 text-blue-300 ring-blue-500/25';
  if (name === 'web_vitals') return 'bg-teal-500/15 text-teal-300 ring-teal-500/30';
  return 'bg-gray-500/15 text-gray-300 ring-gray-500/30';
}

const truncateValue = (value: unknown, max = 42): string => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

/** Property key → chip label (drop noisy id suffixes, space out snake_case). */
function chipLabel(key: string): string {
  return key.replace(/_id$/i, '').replace(/_/g, ' ');
}

/** Human-readable chips for an event's properties — replaces raw JSON. */
function DetailChips({ properties }: { properties: Record<string, unknown> | null }) {
  if (!properties || Object.keys(properties).length === 0) {
    return <span className="text-xs text-gray-600">—</span>;
  }
  return (
    <div className="flex max-w-md flex-wrap gap-1">
      {Object.entries(properties)
        .slice(0, 8)
        .map(([key, value]) => {
          if (value === null || value === undefined) return null;
          // Correctness chips are the one thing worth loud color.
          if (key === 'correct' && typeof value === 'boolean') {
            return (
              <span
                key={key}
                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                  value ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                }`}
              >
                {value ? '✓ correct' : '✗ wrong'}
              </span>
            );
          }
          return (
            <span
              key={key}
              className="rounded bg-gray-800 px-1.5 py-0.5 text-[11px] text-gray-300"
              title={`${key}: ${String(value)}`}
            >
              <span className="text-gray-500">{chipLabel(key)}</span> {truncateValue(value)}
            </span>
          );
        })}
      {Object.keys(properties).length > 8 && (
        <span className="text-[11px] text-gray-500">
          +{Object.keys(properties).length - 8} more
        </span>
      )}
    </div>
  );
}

export function EventsBrowser(): JSX.Element {
  const [eventName, setEventName] = useState('');
  const [module, setModule] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [actor, setActor] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AnalyticsEventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  // Journey timeline (per-visitor chronological view).
  const [journeyActor, setJourneyActor] = useState<string | null>(null);
  const [journeyRows, setJourneyRows] = useState<AnalyticsEventRow[]>([]);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyFailed, setJourneyFailed] = useState(false);

  const limit = 25;

  useEffect(() => {
    setIsLoading(true);
    setFailed(false);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (eventName) params.set('eventName', eventName);
    if (module) params.set('module', module);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (actor.trim()) params.set('actor', actor.trim());
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
  }, [eventName, module, from, to, actor, page]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openJourney = (target: string) => {
    setJourneyActor(target);
    setJourneyLoading(true);
    setJourneyFailed(false);
    const params = new URLSearchParams({ actor: target, order: 'asc', limit: '200', page: '1' });
    adminApi
      .get<{ data: AnalyticsEventRow[] }>(`/admin/analytics/events?${params.toString()}`)
      .then((response) => setJourneyRows(response.data.data))
      .catch(() => setJourneyFailed(true))
      .finally(() => setJourneyLoading(false));
  };

  const closeJourney = () => {
    setJourneyActor(null);
    setJourneyRows([]);
    setJourneyFailed(false);
  };

  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-100">
        <Search className="h-5 w-5 text-cyan-400" /> Raw Events
      </h3>

      <div className="mb-3 flex flex-wrap gap-3">
        <input
          value={eventName}
          list="analytics-event-names"
          onChange={(e) => {
            setEventName(e.target.value);
            setPage(1);
          }}
          placeholder="All event names"
          className={inputClass}
          aria-label="Filter by event name"
        />
        <datalist id="analytics-event-names">
          {KNOWN_EVENT_NAMES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <select
          value={module}
          onChange={(e) => {
            setModule(e.target.value);
            setPage(1);
          }}
          className={selectClass}
          aria-label="Filter by module"
        >
          <option value="">All modules</option>
          {KNOWN_MODULES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-gray-400">{total.toLocaleString()} events</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-sm text-gray-400">
          <CalendarDays className="h-4 w-4 text-gray-500" />
          From
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            className={inputClass}
            aria-label="From date"
          />
        </label>
        <label className="flex items-center gap-1.5 text-sm text-gray-400">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            className={inputClass}
            aria-label="To date"
          />
        </label>
        <label className="flex min-w-56 flex-1 items-center gap-1.5 text-sm text-gray-400 sm:max-w-xs">
          <UserSearch className="h-4 w-4 text-gray-500" />
          <input
            value={actor}
            onChange={(e) => {
              setActor(e.target.value);
              setPage(1);
            }}
            placeholder="userId / guestId / sessionId"
            className={`${inputClass} w-full`}
            aria-label="Filter by actor id"
          />
        </label>
      </div>

      {failed && <p className="text-sm text-red-400">Could not load events. Is the API running?</p>}

      {/* Journey timeline — one visitor's events in chronological order */}
      {journeyActor && (
        <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-100">
              <UserSearch className="h-4 w-4 text-cyan-400" />
              Journey · <span className="font-mono text-xs text-gray-400">{journeyActor}</span>
            </h4>
            <button
              onClick={closeJourney}
              className="rounded p-1 text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              aria-label="Close journey timeline"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {journeyLoading ? (
            <p className="py-4 text-center text-sm text-gray-400">Loading journey…</p>
          ) : journeyFailed ? (
            <p className="py-4 text-center text-sm text-red-400">Could not load the journey.</p>
          ) : journeyRows.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">No events for this actor.</p>
          ) : (
            <div className="max-h-96 space-y-0.5 overflow-y-auto pr-1">
              {journeyRows.map((row, i) => {
                const prev = journeyRows[i - 1];
                const newSession = row.sessionId && row.sessionId !== prev?.sessionId;
                return (
                  <div key={row.id}>
                    {newSession && (
                      <p className="mb-1 mt-2 font-mono text-xs font-semibold text-cyan-300">
                        session {row.sessionId?.slice(0, 12)}…
                      </p>
                    )}
                    <div className="flex items-center gap-2 border-l-2 border-cyan-500/30 py-1 pl-3 text-xs">
                      <span className="w-32 shrink-0 font-mono text-gray-500">
                        {row.serverTs ? new Date(row.serverTs).toLocaleString() : '—'}
                      </span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-medium ring-1 ${eventBadgeClass(row.eventName)}`}
                      >
                        {row.eventName}
                      </span>
                      <DetailChips properties={row.properties} />
                    </div>
                  </div>
                );
              })}
              {journeyRows.length === 200 && (
                <p className="mt-2 text-xs text-gray-500">
                  Showing the first 200 events — narrow with the filters to see more.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {failed ? null : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Event</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Module</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Time (server)</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Actor</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-400">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-400">
                    No events match the filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-800/40">
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block whitespace-nowrap rounded px-2 py-0.5 text-xs font-medium ring-1 ${eventBadgeClass(row.eventName)}`}
                      >
                        {row.eventName}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-400">{row.module ?? '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                      {row.serverTs ? new Date(row.serverTs).toLocaleString() : '—'}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-400">
                      {(() => {
                        const journeyTarget = row.userId ?? row.guestId;
                        if (!journeyTarget && !row.sessionId) return '—';
                        return (
                          <button
                            onClick={() => openJourney(journeyTarget ?? row.sessionId!)}
                            className="text-left text-cyan-400 hover:text-cyan-300 hover:underline"
                            title={`Show journey for ${journeyTarget ?? row.sessionId}`}
                          >
                            {row.userId
                              ? `u:${shortId(row.userId)}`
                              : row.guestId
                                ? `g:${shortId(row.guestId)}`
                                : 's:—'}
                            {row.sessionId ? ` s:${shortId(row.sessionId)}` : ''}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-2">
                      <DetailChips properties={row.properties} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded border border-gray-700 px-2 py-1 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-gray-700 px-2 py-1 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
