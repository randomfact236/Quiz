'use client';

/**
 * ============================================================================
 * CommentsSection — admin moderation for the shared comments feed
 * ============================================================================
 * Backed by /admin/comments (list, filterable by status/contentType) and
 * /admin/comments/bulk-action (single-row actions reuse it). Trash = soft
 * hide (row disappears from all public feeds); delete = hard removal.
 * ============================================================================
 */

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, RefreshCw } from 'lucide-react';

import {
  bulkActionComments,
  getCommentsAdmin,
  type AdminCommentRow,
  type CommentBulkAction,
  type CommentContentType,
  type CommentStatus,
} from '@/lib/comments-api';
import { getErrorMessage } from '@/lib/media-api';
import { toast } from '@/lib/toast';

const PAGE_SIZE = 25;

const STATUS_FILTERS: Array<{ value: CommentStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'trash', label: 'Hidden' },
  { value: 'draft', label: 'Draft' },
];

const CONTENT_FILTERS: Array<{ value: CommentContentType | 'all'; label: string }> = [
  { value: 'all', label: 'All content' },
  { value: 'image-riddle', label: '🖼️ Image riddles' },
  { value: 'joke', label: '😄 Dad jokes' },
];

function statusBadge(status: CommentStatus): JSX.Element {
  const styles: Record<CommentStatus, string> = {
    published: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    trash: 'bg-red-100 text-red-600',
  };
  const labels: Record<CommentStatus, string> = {
    published: 'Published',
    draft: 'Draft',
    trash: 'Hidden',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function kindLabel(kind: AdminCommentRow['kind'], chip: string | null): string {
  if (kind === 'guess') return 'Guess';
  if (kind === 'chip') return `Chip: ${chip ?? '—'}`;
  return 'Comment';
}

export function CommentsSection() {
  const [rows, setRows] = useState<AdminCommentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CommentStatus | 'all'>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<CommentContentType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actingIds, setActingIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCommentsAdmin({
        status: statusFilter === 'all' ? undefined : statusFilter,
        contentType: contentTypeFilter === 'all' ? undefined : contentTypeFilter,
        page,
        limit: PAGE_SIZE,
      });
      setRows(result.data);
      setTotal(result.total);
      setTotalPages(Math.max(1, Math.ceil(result.total / PAGE_SIZE)));
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to load comments.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, contentTypeFilter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = useCallback(
    async (id: string, action: CommentBulkAction, confirmText?: string) => {
      if (confirmText && !confirm(confirmText)) return;
      setActingIds((prev) => new Set(prev).add(id));
      try {
        const result = await bulkActionComments([id], action);
        if (result.succeeded > 0) {
          toast.success(
            action === 'delete'
              ? 'Comment deleted'
              : action === 'trash'
                ? 'Comment hidden'
                : 'Comment published'
          );
        } else {
          toast.error('Action failed.');
        }
        await load();
      } catch (err) {
        toast.error(getErrorMessage(err) || 'Action failed.');
      } finally {
        setActingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Comments
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Moderate guesses, reveal-chips, and joke replies · {total} total
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => {
                setStatusFilter(filter.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                statusFilter === filter.value
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <select
          value={contentTypeFilter}
          onChange={(e) => {
            setContentTypeFilter(e.target.value as CommentContentType | 'all');
            setPage(1);
          }}
          className="rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          aria-label="Filter by content type"
        >
          {CONTENT_FILTERS.map((filter) => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No comments match this filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {statusBadge(row.status)}
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase text-indigo-600">
                    {row.contentType === 'image-riddle' ? '🖼️ Riddle' : '😄 Joke'}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {kindLabel(row.kind, row.chip)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(row.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 break-words">
                  {row.masked ? 'Someone solved it 🔓 (masked)' : row.text}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate" title={row.guestId}>
                  guest {row.guestId} · content {row.contentId.slice(0, 8)}…
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {row.status !== 'published' && (
                  <button
                    onClick={() => runAction(row.id, 'publish')}
                    disabled={actingIds.has(row.id)}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    Publish
                  </button>
                )}
                {row.status !== 'trash' && (
                  <button
                    onClick={() => runAction(row.id, 'trash')}
                    disabled={actingIds.has(row.id)}
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
                  >
                    Hide
                  </button>
                )}
                <button
                  onClick={() => runAction(row.id, 'delete', 'Permanently delete this comment?')}
                  disabled={actingIds.has(row.id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 dark:border-gray-700 dark:text-white"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded border text-sm disabled:opacity-40 dark:border-gray-700 dark:text-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
