'use client';

/**
 * ============================================================================
 * NewsletterSection — admin subscriber list + CSV export
 * ============================================================================
 * Consumes the newsletter admin endpoints (GET /newsletter paginated list,
 * GET /newsletter/export CSV of active subscribers). Shows active/unsubscribed
 * status per address with a status filter and client-side search.
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';

import { adminApi, ApiError } from '@/lib/api-client';

interface Subscriber {
  id: string;
  email: string;
  source: 'footer' | 'about';
  unsubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

type StatusFilter = 'active' | 'unsubscribed' | 'all';

const PAGE_SIZE = 10;

export function NewsletterSection(): JSX.Element {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.get<{ data: Subscriber[]; total: number }>(
        '/newsletter?limit=200'
      );
      setSubscribers(res.data?.data ?? []);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load subscribers');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCsv = async () => {
    setIsExporting(true);
    try {
      const res = await adminApi.get<{ csv: string; filename: string }>('/newsletter/export');
      const blob = new Blob([res.data.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.data.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Subscribers exported');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const activeCount = subscribers.filter((s) => !s.unsubscribed).length;
  const unsubscribedCount = subscribers.length - activeCount;

  const filtered = useMemo(() => {
    return subscribers.filter((s) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && !s.unsubscribed) ||
        (statusFilter === 'unsubscribed' && s.unsubscribed);
      const matchesSearch =
        searchTerm === '' || s.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [subscribers, statusFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div>
      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Active subscribers</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Unsubscribed</p>
          <p className="text-2xl font-bold text-slate-400">{unsubscribedCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total ever subscribed</p>
          <p className="text-2xl font-bold text-indigo-600">{subscribers.length}</p>
        </div>
      </div>

      {/* Filters + actions */}
      <div className="mb-6 flex flex-wrap gap-3">
        {(['active', 'unsubscribed', 'all'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => {
              setStatusFilter(f);
              setCurrentPage(1);
            }}
            className={`rounded-full px-5 py-2.5 text-sm font-medium capitalize transition-all ${
              statusFilter === f
                ? 'bg-indigo-600 text-white shadow-md'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="min-w-[200px] flex-1 rounded-lg border border-slate-300 px-4 py-2"
        />
        <button
          onClick={() => void fetchSubscribers()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <button
          onClick={() => void exportCsv()}
          disabled={isExporting || activeCount === 0}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {isExporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {['Email', 'Source', 'Subscribed', 'Status'].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No subscribers {statusFilter !== 'all' ? `in "${statusFilter}"` : 'yet'}
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{s.email}</td>
                  <td className="px-6 py-4 text-sm capitalize text-slate-600">{s.source}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatDate(s.createdAt)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        s.unsubscribed
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {s.unsubscribed ? 'Unsubscribed' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              Page {page} of {totalPages} · {filtered.length} shown
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border border-slate-300 px-3 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
