/**
 * ============================================================================
 * GuessFeed — the riddle's guess wall (comments-system plan §3.1)
 * ============================================================================
 * Rendered in the modal once the answer is shown. Shows recent guesses
 * verbatim, correct solves masked ("Someone solved it 🔓"), chip tallies
 * ("🤯 ×14"), and an "N guesses today" social-proof line. The caller's own
 * entries (matched by guestId on the backend) get a 🗑 delete button with
 * optimistic removal.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

import { deleteMyComment, getComments, type Comment } from '@/lib/comments-api';
import { CHIP_OPTIONS } from '@/lib/comments-api';

import { trackImageRiddleEvent } from '../lib/analytics';

const CHIP_EMOJI: Record<string, string> = Object.fromEntries(
  CHIP_OPTIONS.map((option) => [option.value, option.emoji])
);

export interface GuessFeedProps {
  riddleId: string;
}

export default function GuessFeed({ riddleId }: GuessFeedProps) {
  const [items, setItems] = useState<Comment[] | null>(null);
  const [chipCounts, setChipCounts] = useState<Record<string, number>>({});
  const [guessesToday, setGuessesToday] = useState(0);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

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

  const chipEntries = Object.entries(chipCounts).filter(([, count]) => count > 0);

  return (
    <div className="shrink-0 rounded-3xl border border-slate-100 bg-slate-50/60 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Guess wall
        </p>
        {guessesToday > 0 && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
            {guessesToday} {guessesToday === 1 ? 'guess' : 'guesses'} today
          </p>
        )}
      </div>

      {chipEntries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {chipEntries.map(([chip, count]) => (
            <span
              key={chip}
              className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-100"
            >
              {CHIP_EMOJI[chip] ?? '🙂'} ×{count}
            </span>
          ))}
        </div>
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
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-bold ${item.masked ? 'bg-green-50 text-green-700' : 'bg-white text-slate-700 border border-slate-100'}`}
            >
              <span className="min-w-0 break-words">
                {item.masked ? 'Someone solved it 🔓' : item.text}
              </span>
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
      )}
    </div>
  );
}
