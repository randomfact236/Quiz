/**
 * ============================================================================
 * GuessFeed — the riddle's guess wall (comments-system plan §3.1)
 * ============================================================================
 * Rendered in the modal and inline on cards. Shows recent guesses verbatim,
 * correct solves masked ("Someone solved it 🔓"), chip confessions as a
 * labeled list, and an "N guesses today" social-proof line. Entries carry
 * the author's display name (guests type any name once; it persists on the
 * device). The caller's own entries get a 🗑 delete button with optimistic
 * removal.
 * ============================================================================
 */

'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { toast } from '@/lib/toast';
import { deleteMyComment, getComments, CHIP_OPTIONS, type Comment } from '@/lib/comments-api';
import { getGuestName, setGuestName } from '@/lib/guest-id';
import { timeAgo } from '@/lib/time-ago';

import { trackImageRiddleEvent } from '../lib/analytics';

const CHIP_EMOJI: Record<string, string> = Object.fromEntries(
  CHIP_OPTIONS.map((option) => [option.value, option.emoji])
);

const CHIP_LABEL: Record<string, string> = Object.fromEntries(
  CHIP_OPTIONS.map((option) => [option.value, option.label])
);

/** Entries shown before the "View all N comments" expander kicks in. */
const COLLAPSED_VISIBLE_COUNT = 4;

export interface GuessFeedProps {
  riddleId: string;
  /** Bump to re-fetch the wall after a local guess/chip commit lands. */
  refreshKey?: number;
}

export default function GuessFeed({ riddleId, refreshKey = 0 }: GuessFeedProps) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadFailed, setLoadFailed] = useState(false);
  const [chipCounts, setChipCounts] = useState<Record<string, number>>({});
  const [guessesToday, setGuessesToday] = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    setDisplayName(getGuestName());
  }, []);

  const fetchPage = useCallback(
    (pageToLoad: number, append: boolean) => {
      setLoadFailed(false);
      getComments('image-riddle', riddleId, pageToLoad)
        .then((feed) => {
          setTotal(feed.total);
          setItems((prev) => (append && prev ? [...prev, ...feed.items] : feed.items));
          setChipCounts(feed.chipCounts);
          setGuessesToday(feed.guessesToday);
        })
        .catch(() => {
          setItems([]);
          setLoadFailed(true);
        });
    },
    [riddleId]
  );

  useEffect(() => {
    setItems(null);
    setPage(1);
    fetchPage(1, false);
  }, [riddleId, fetchPage]);

  // Re-fetch when the caller commits a new guess/chip (see useImageRiddleGame).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPage(1, false);
  }, [refreshKey, fetchPage]);

  const handleDelete = useCallback(async (id: string) => {
    trackImageRiddleEvent('delete_comment', { riddleId: id });
    setDeletingIds((prev) => new Set(prev).add(id));
    const ok = await deleteMyComment(id);
    if (ok) {
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : prev));
      setTotal((prev) => Math.max(0, prev - 1));
    } else {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.error('Could not delete — please try again.');
    }
  }, []);

  const saveName = useCallback(() => {
    const trimmed = nameDraft.trim().slice(0, 50);
    setGuestName(trimmed);
    setDisplayName(trimmed);
    setEditingName(false);
  }, [nameDraft]);

  const chipEntries = Object.entries(chipCounts).filter(([, count]) => count > 0);

  return (
    <div className="shrink-0 rounded-3xl border border-slate-100 dark:border-secondary-800 bg-slate-50 dark:bg-secondary-800/60 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-secondary-400">
          Guess wall
        </p>
        <div className="flex items-center gap-2">
          {guessesToday > 0 && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              {guessesToday} {guessesToday === 1 ? 'guess' : 'guesses'} today
            </p>
          )}
          {editingName ? (
            <span className="flex items-center gap-1">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                maxLength={50}
                placeholder="Your name"
                autoFocus
                className="w-28 rounded-full border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-secondary-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:text-secondary-200 focus:outline-none"
                aria-label="Your display name"
              />
              <button
                onClick={saveName}
                className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white"
              >
                Save
              </button>
            </span>
          ) : (
            <button
              onClick={() => {
                setNameDraft(displayName);
                setEditingName(true);
              }}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-secondary-400 hover:text-indigo-500"
              title="Set the name shown with your guesses"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              {displayName ? `as ${displayName}` : 'as Guest'}
            </button>
          )}
        </div>
      </div>

      {chipEntries.length > 0 && (
        <ul className="space-y-1.5">
          {chipEntries.map(([chip, count]) => (
            <li
              key={chip}
              className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-500/30"
            >
              <span className="text-base" aria-hidden="true">
                {CHIP_EMOJI[chip] ?? '🙂'}
              </span>
              <span className="flex-1 min-w-0 break-words">
                &ldquo;{CHIP_LABEL[chip] ?? chip}&rdquo;
              </span>
              <span className="shrink-0 tabular-nums">×{count}</span>
            </li>
          ))}
        </ul>
      )}

      {items === null ? (
        <div className="space-y-2" aria-hidden="true">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-10 rounded-xl bg-slate-100 dark:bg-secondary-800 animate-pulse"
            />
          ))}
        </div>
      ) : loadFailed ? (
        <div className="rounded-xl border border-red-100 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-2.5">
          <p className="text-sm font-bold text-red-600 dark:text-red-300">
            Couldn&apos;t load the guess wall.
          </p>
          <button
            onClick={() => fetchPage(1, false)}
            className="mt-1 text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-700 dark:hover:text-red-300"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm font-bold text-slate-400 dark:text-secondary-400">
          No guesses yet — you&apos;re the first to peek. 👀
        </p>
      ) : (
        <>
          {/* Blog-style list: a few entries collapsed; expanded state scrolls */}
          <ul className={`space-y-2 ${showAllComments ? 'max-h-64 overflow-y-auto' : ''}`}>
            {(showAllComments ? items : items.slice(0, COLLAPSED_VISIBLE_COUNT)).map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${item.masked ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-white dark:bg-secondary-800 text-slate-700 dark:text-secondary-200 border border-slate-100 dark:border-secondary-800'}`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-secondary-400">
                    {item.authorName || 'Guest'} · {timeAgo(item.createdAt)}
                  </p>
                  <p className="break-words">
                    {item.masked ? `${item.authorName || 'Someone'} solved it 🔓` : item.text}
                  </p>
                </div>
                {item.mine && (
                  <button
                    onClick={() => void handleDelete(item.id)}
                    disabled={deletingIds.has(item.id)}
                    className="shrink-0 rounded-full p-1 text-slate-300 transition-colors hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
                    aria-label="Delete my guess"
                    title="Delete my guess"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {items.length > COLLAPSED_VISIBLE_COUNT && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="w-full rounded-xl bg-white dark:bg-secondary-800 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 border border-slate-100 dark:border-secondary-800 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
              aria-label={`Show all ${items.length} guesses`}
            >
              See all {items.length} guesses
            </button>
          )}
          {showAllComments && items.length < total && (
            <button
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchPage(next, true);
              }}
              className="w-full rounded-xl bg-white dark:bg-secondary-800 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 border border-slate-100 dark:border-secondary-800 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
            >
              Load more ({items.length} of {total})
            </button>
          )}
        </>
      )}
    </div>
  );
}
