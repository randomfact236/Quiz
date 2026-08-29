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

import { Pencil } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
}

export default function GuessFeed({ riddleId }: GuessFeedProps) {
  const [items, setItems] = useState<Comment[] | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    getComments('image-riddle', riddleId)
      .then((feed) => {
        if (cancelled) return;
        setItems(feed.items);
        setChipCounts(feed.chipCounts);
        setGuessesToday(feed.guessesToday);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [riddleId]);

  const handleDelete = useCallback(async (id: string) => {
    trackImageRiddleEvent('delete_comment', { riddleId: id });
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

  const saveName = useCallback(() => {
    const trimmed = nameDraft.trim().slice(0, 50);
    setGuestName(trimmed);
    setDisplayName(trimmed);
    setEditingName(false);
  }, [nameDraft]);

  const chipEntries = Object.entries(chipCounts).filter(([, count]) => count > 0);

  return (
    <div className="shrink-0 rounded-3xl border border-slate-100 bg-slate-50/60 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
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
                className="w-28 rounded-full border border-indigo-200 bg-white px-2.5 py-0.5 text-[10px] font-bold text-slate-700 focus:outline-none"
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
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-500"
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
              className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 border border-amber-100"
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
            <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm font-bold text-slate-400">
          No guesses yet — you&apos;re the first to peek. 👀
        </p>
      ) : (
        <>
          {/* Blog-style list: a few entries collapsed; expanded state scrolls */}
          <ul className={`space-y-2 ${showAllComments ? 'max-h-64 overflow-y-auto' : ''}`}>
            {(showAllComments ? items : items.slice(0, COLLAPSED_VISIBLE_COUNT)).map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${item.masked ? 'bg-green-50 text-green-700' : 'bg-white text-slate-700 border border-slate-100'}`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                    className="shrink-0 rounded-full p-1 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    aria-label="Delete my guess"
                    title="Delete my guess"
                  >
                    🗑
                  </button>
                )}
              </li>
            ))}
          </ul>
          {items.length > COLLAPSED_VISIBLE_COUNT && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="w-full rounded-xl bg-white py-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 border border-slate-100 transition-colors hover:bg-indigo-50"
              aria-label={`View all ${items.length} comments`}
            >
              View all {items.length} comments
            </button>
          )}
        </>
      )}
    </div>
  );
}
