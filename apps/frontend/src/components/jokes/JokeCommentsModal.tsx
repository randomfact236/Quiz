/**
 * ============================================================================
 * JokeCommentsModal — 💬 replies on a dad joke (comments-system plan §4)
 * ============================================================================
 * Lightweight modal opened from the card back's 💬 chip: free-text replies
 * (kind 'comment' only — no guess/chip semantics for jokes), the public
 * feed, and delete-own via the shared guest identity. Posting is
 * fire-and-forget-friendly: an optimistic local entry shows instantly and
 * a failed POST just keeps the local copy.
 * ============================================================================
 */

'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { deleteMyComment, getComments, postComment, type Comment } from '@/lib/comments-api';

const MAX_LENGTH = 280;

export interface JokeCommentsModalProps {
  jokeId: string;
  jokeSetup: string;
  /** Called after a successful post so the card's 💬 chip can update. */
  onPosted?: () => void;
  onClose: () => void;
}

export default function JokeCommentsModal({
  jokeId,
  jokeSetup,
  onPosted,
  onClose,
}: JokeCommentsModalProps) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [text, setText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    getComments('joke', jokeId)
      .then((feed) => {
        if (!cancelled) setItems(feed.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [jokeId]);

  // Close on Escape; backdrop click handled on the overlay itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
        masked: false,
        createdAt: new Date().toISOString(),
        mine: true,
      };
      setItems((prev) => (prev ? [optimistic, ...prev] : [optimistic]));
      setText('');
      const saved = await postComment({
        contentType: 'joke',
        contentId: jokeId,
        kind: 'comment',
        text: trimmed,
      });
      setPosting(false);
      if (saved) {
        // Swap the optimistic copy for the persisted one.
        setItems((prev) =>
          prev ? prev.map((item) => (item.id === optimistic.id ? saved : item)) : prev
        );
        onPosted?.();
      }
    },
    [text, posting, jokeId, onPosted]
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Comments for: ${jokeSetup}`}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-orange-100 px-6 py-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
              💬 Joke replies
            </p>
            <p className="truncate text-sm font-bold text-gray-800">{jokeSetup}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-600"
            aria-label="Close comments"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-2">
          {items === null ? (
            <div className="space-y-2" aria-hidden="true">
              <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-12 rounded-xl bg-gray-100 animate-pulse" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm font-semibold text-gray-400">
              No replies yet — be the first to 😂
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-2xl bg-orange-50/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 break-words">{item.text}</p>
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {item.mine && (
                  <button
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingIds.has(item.id)}
                    className="shrink-0 rounded-full p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    aria-label="Delete my reply"
                    title="Delete my reply"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <form onSubmit={(e) => void handlePost(e)} className="border-t border-orange-100 p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={MAX_LENGTH}
              placeholder="Add a reply…"
              className="flex-1 rounded-full border-2 border-gray-100 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800 placeholder:text-gray-300 focus:border-orange-300 focus:bg-white focus:outline-none transition-colors"
              aria-label="Write a reply"
            />
            <button
              type="submit"
              disabled={posting || text.trim().length === 0}
              className="rounded-full bg-orange-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {posting ? '…' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
