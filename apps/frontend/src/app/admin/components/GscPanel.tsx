'use client';

/**
 * ============================================================================
 * GscPanel — live Google Search Console performance (admin SEO dashboard)
 * ============================================================================
 * Fetches GET /settings/gsc/overview?days=N (admin-only) and renders totals +
 * top queries + top pages. When the backend has no service account (or it
 * lacks property access) it shows the connection guide instead of data.
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { adminApi, ApiError } from '@/lib/api-client';

type GscOverviewResponse = {
  connected: boolean;
  reason?: string;
  property?: string;
  clientEmail?: string;
  startDate?: string;
  endDate?: string;
  totals?: { clicks: number; impressions: number; ctr: number; position: number };
  queries?: Array<{
    key: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  pages?: Array<{
    key: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
};

const RANGES = [7, 28, 90] as const;

export default function GscPanel(): JSX.Element {
  const [days, setDays] = useState<7 | 28 | 90>(28);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GscOverviewResponse | null>(null);

  const load = useCallback(async (range: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.get<GscOverviewResponse>(
        `/settings/gsc/overview?days=${range}`
      );
      setData(response.data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load Search Console data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [load, days]);

  return (
    <div className="rounded-xl bg-card p-5 ring-1 ring-border">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-100">Google Search Console — Top Queries</h4>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-secondary-400">
            What people searched on Google when they found your site.
            {data?.connected && data.property ? ` Property: ${data.property}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full ring-1 ring-border">
            {RANGES.map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setDays(range)}
                className={`px-3 py-1 text-xs font-semibold transition-colors ${
                  days === range
                    ? 'bg-cyan-500/20 text-cyan-300'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {range}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load(days)}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-gray-400 transition-colors hover:text-gray-200"
            title="Refresh"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
              data?.connected
                ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30'
                : 'bg-gray-100 dark:bg-secondary-800 text-gray-400 dark:text-secondary-400'
            }`}
          >
            {loading ? 'Loading…' : data?.connected ? 'Connected' : 'Not connected'}
          </span>
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg bg-red-500/5 p-4 ring-1 ring-red-500/30">
          <p className="text-sm font-semibold text-red-300">{error}</p>
        </div>
      ) : loading ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-500/5 p-4 text-xs text-gray-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading Search Console data…
        </div>
      ) : !data?.connected ? (
        <div className="mt-3 rounded-lg bg-amber-500/5 p-4 ring-1 ring-amber-500/30">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4" /> Search Console data unavailable
          </p>
          {data?.reason && <p className="mt-1 text-xs text-amber-200/70">{data.reason}</p>}
          <ol className="mt-3 list-decimal space-y-1 pl-4 text-xs text-amber-200/70">
            <li>
              Google Cloud Console → create a <b>service account</b> with the Search Console API
              enabled; download its JSON key.
            </li>
            <li>
              Backend env <code className="text-cyan-300">GOOGLE_SERVICE_ACCOUNT_JSON</code> = the
              JSON key contents → restart the API.
            </li>
            <li>
              Search Console → Settings → Users and permissions → add the service account&apos;s
              email as an Owner.
            </li>
          </ol>
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Clicks', value: data.totals?.clicks ?? 0 },
              { label: 'Impressions', value: data.totals?.impressions ?? 0 },
              { label: 'CTR', value: `${Math.round((data.totals?.ctr ?? 0) * 1000) / 10}%` },
              {
                label: 'Avg position',
                value: Math.round((data.totals?.position ?? 0) * 10) / 10,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-gray-500/5 p-3 ring-1 ring-border">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-secondary-400">
                  {kpi.label}
                </p>
                <p className="mt-1 text-xl font-black text-gray-100">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Top queries */}
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-secondary-400">
              Top queries
            </p>
            {(data.queries?.length ?? 0) === 0 ? (
              <p className="rounded-lg bg-gray-500/5 p-3 text-xs text-gray-400">
                No query data for this range yet — Search Console lags ~2 days.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg ring-1 ring-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-500/5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-secondary-400">
                    <tr>
                      <th className="px-3 py-2">Query</th>
                      <th className="px-3 py-2">Clicks</th>
                      <th className="px-3 py-2">Impr.</th>
                      <th className="px-3 py-2">CTR</th>
                      <th className="px-3 py-2">Pos.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.queries ?? []).map((q) => (
                      <tr key={q.key} className="border-t border-gray-500/10">
                        <td className="max-w-[280px] truncate px-3 py-2 font-semibold text-gray-200">
                          {q.key}
                        </td>
                        <td className="px-3 py-2 text-gray-300">{q.clicks}</td>
                        <td className="px-3 py-2 text-gray-300">{q.impressions}</td>
                        <td className="px-3 py-2 text-gray-300">
                          {Math.round(q.ctr * 1000) / 10}%
                        </td>
                        <td className="px-3 py-2 text-gray-300">
                          {Math.round(q.position * 10) / 10}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top pages */}
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-secondary-400">
              Top pages
            </p>
            {(data.pages?.length ?? 0) === 0 ? (
              <p className="rounded-lg bg-gray-500/5 p-3 text-xs text-gray-400">
                No page data for this range yet.
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg ring-1 ring-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-500/5 text-[10px] uppercase tracking-wider text-gray-500 dark:text-secondary-400">
                    <tr>
                      <th className="px-3 py-2">Page</th>
                      <th className="px-3 py-2">Clicks</th>
                      <th className="px-3 py-2">Impr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.pages ?? []).map((page) => (
                      <tr key={page.key} className="border-t border-gray-500/10">
                        <td className="max-w-[320px] truncate px-3 py-2 font-semibold text-gray-200">
                          {page.key}
                        </td>
                        <td className="px-3 py-2 text-gray-300">{page.clicks}</td>
                        <td className="px-3 py-2 text-gray-300">{page.impressions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-gray-600 dark:text-secondary-300">
            Data source: Google Search Console API · {data.startDate} → {data.endDate} (data lags ~2
            days) ·{' '}
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              open GSC ↗
            </a>
          </p>
        </>
      )}
    </div>
  );
}
