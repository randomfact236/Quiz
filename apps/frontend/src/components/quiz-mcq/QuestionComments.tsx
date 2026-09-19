/**
 * ============================================================================
 * QuestionComments — per-question comments on the quiz REVIEW screen
 * ============================================================================
 * BUG-036, owner-scoped 2026-09-18: commenting lives on the results/review
 * screen, never in the live play flow. Inline (not a modal) — it expands under
 * a question the player just reviewed, so there is something concrete to
 * react to. Same plumbing as joke replies: shared guest identity, optimistic
 * post, delete-own. The toggle collapses to a 💬 count so empty threads never
 * clutter the review.
 * ============================================================================
 */

'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

import {
  deleteMyComment,
  getComments,
  postComment,
  type Comment,
  type CommentContentType,
} from '@/lib/comments-api';
import { getGuestName, setGuestName } from '@/lib/guest-id';
import { timeAgo } from '@/lib/time-ago';

const MAX_LENGTH = 280;

/** Backend UUIDs only — guards against odd local/resumed session ids. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface QuestionCommentsProps {
  contentType: Extract<CommentContentType, 'quiz-question' | 'riddle-question'>;
  questionId: string;
  /** Play-flow usage: the feed renders expanded immediately (BUG-040). */
  autoOpen?: boolean;
}

export function QuestionComments({
  contentType,
  questionId,
  autoOpen,
}: QuestionCommentsProps): JSX.Element {
  const [open, setOpen] = useState(!!autoOpen);
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !UUID_RE.test(questionId)) return;
    let cancelled = false;
    setItems(null);
    getComments(contentType, questionId)
      .then((feed) => {
        if (!cancelled) {
          setItems(feed.items);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, contentType, questionId]);

  useEffect(() => {
    setName(getGuestName());
  }, []);

  const handlePost = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = text.trim();
      if (trimmed.length === 0 || posting) return;
      setPosting(true);
      const optimistic: Comment = {
        id: `local-${Date.now()}`,
        kind: 'comment',
        text: trimmed,
        chip: null,
        authorName: name.trim() || null,
        masked: false,
        createdAt: new Date().toISOString(),
        mine: true,
      };
      setItems((prev) => (prev ? [optimistic, ...prev] : [optimistic]));
      setText('');
      const saved = await postComment({
        contentType,
        contentId: questionId,
        kind: 'comment',
        text: trimmed,
        ...(name.trim() ? { authorName: name.trim() } : {}),
      });
      setPosting(false);
      if (saved) {
        setItems((prev) =>
          prev ? prev.map((item) => (item.id === optimistic.id ? saved : item)) : prev
        );
      }
      // A failed POST keeps the optimistic local copy (same rule as jokes).
    },
    [text, posting, contentType, questionId, name]
  );

  const handleDelete = useCallback(async (id: string) => {
    if (id.startsWith('local-')) {
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
      return;
    }
    setDeletingIds((prev) => new Set(prev).add(id));
    const ok = await deleteMyComment(id);
    if (ok) {
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
    } else {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  if (!UUID_RE.test(questionId)) return <></>;

  return (
    <div className="mt-4 rounded-xl bg-gray-50 dark:bg-secondary-800/60 p-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 text-left text-sm font-semibold text-gray-600 dark:text-secondary-300 transition-colors hover:text-indigo-500"
        aria-expanded={open}
      >
        <MessageCircle className="h-4 w-4 text-indigo-400" />
        {open ? 'Hide comments' : 'Comments'}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {items === null ? (
            <div className="space-y-2" aria-hidden="true">
              <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-secondary-800" />
              <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-secondary-800" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-4 text-center text-sm font-semibold text-gray-400 dark:text-secondary-400">
              No comments yet — share a tip or report a typo.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl bg-white dark:bg-secondary-800 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-secondary-400">
                    {item.authorName || 'Guest'}
                  </p>
                  <p className="break-words text-sm font-semibold text-gray-800 dark:text-secondary-100">
                    {item.text}
                  </p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-secondary-400">
                    {timeAgo(item.createdAt)}
                  </p>
                </div>
                {item.mine && (
                  <button
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingIds.has(item.id)}
                    className="shrink-0 rounded-full p-1 text-gray-300 transition-colors hover:bg-red-100 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-500/20"
                    aria-label="Delete my comment"
                    title="Delete my comment"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))
          )}

          <form onSubmit={(e) => void handlePost(e)} className="pt-1">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setGuestName(e.target.value);
              }}
              maxLength={50}
              placeholder="Your name (optional)"
              className="mb-2 w-full rounded-full border-2 border-gray-100 dark:border-secondary-800 bg-gray-50 dark:bg-secondary-800 px-4 py-1.5 text-xs font-bold text-gray-700 dark:text-secondary-200 placeholder:text-gray-300 focus:border-indigo-300 focus:bg-white focus:outline-none transition-colors"
              aria-label="Your display name"
            />
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={MAX_LENGTH}
                placeholder="Add a comment…"
                className="flex-1 rounded-full border-2 border-gray-100 dark:border-secondary-800 bg-gray-50 dark:bg-secondary-800 px-4 py-2 text-sm font-semibold text-gray-800 dark:text-secondary-100 placeholder:text-gray-300 focus:border-indigo-300 focus:bg-white focus:outline-none transition-colors"
                aria-label="Write a comment"
              />
              <button
                type="submit"
                disabled={posting || text.trim().length === 0}
                className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {posting ? '…' : 'Post'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
