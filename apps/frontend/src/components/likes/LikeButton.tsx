/**
 * ============================================================================
 * LikeButton — frictionless one-tap heart on questions (BUG-037/BUG-048)
 * ============================================================================
 * Tapping sends the like once per guest (server-side dedupe); the heart
 * fills to confirm. BUG-048 (2026-09-20): the like total is now PUBLIC —
 * shown beside the heart. The 1/2/3+-like BUCKETS remain internal (admin
 * view only). Hidden entirely when the question id is not a backend UUID
 * (sample/local-only sessions).
 *
 * Login-merge UX (2026-09-20): the fill restores for the guest id OR the
 * signed-in account (server matches either), and the first guest like pops
 * a non-blocking "log in to keep it" prompt — once per browser session.
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/contexts/AuthContext';
import {
  getQuestionLikeCounts,
  likedByMe,
  likeQuestion,
  type QuestionLikeContentType,
} from '@/lib/question-likes-api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const GUEST_PROMPT_SEEN_KEY = 'aiquiz:guest-like-prompt-seen';

function guestPromptSeen(): boolean {
  try {
    return window.sessionStorage.getItem(GUEST_PROMPT_SEEN_KEY) === '1';
  } catch {
    return true; // storage unavailable — never nag
  }
}

function markGuestPromptSeen(): void {
  try {
    window.sessionStorage.setItem(GUEST_PROMPT_SEEN_KEY, '1');
  } catch {
    /* ignore */
  }
}

export interface LikeButtonProps {
  contentType: QuestionLikeContentType;
  questionId: string;
}

export function LikeButton({ contentType, questionId }: LikeButtonProps): JSX.Element | null {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);

  useEffect(() => {
    if (!UUID_RE.test(questionId)) return;
    let cancelled = false;
    likedByMe(contentType, questionId).then((v) => {
      if (!cancelled && v) setLiked(true);
    });
    getQuestionLikeCounts(contentType, [questionId]).then((counts) => {
      if (!cancelled) setCount(counts[questionId] ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [contentType, questionId]);

  // Auto-dismiss the guest prompt so it never lingers.
  useEffect(() => {
    if (!showGuestPrompt) return;
    const timer = window.setTimeout(() => setShowGuestPrompt(false), 10_000);
    return () => window.clearTimeout(timer);
  }, [showGuestPrompt]);

  if (!UUID_RE.test(questionId)) return null;

  const dismissGuestPrompt = () => {
    markGuestPromptSeen();
    setShowGuestPrompt(false);
  };

  const tap = () => {
    if (liked || busy) return;
    setBusy(true);
    setLiked(true); // optimistic fill
    setCount((c) => (c === null ? c : c + 1));
    void likeQuestion(contentType, questionId).then((res) => {
      if (!res) {
        setLiked(false); // network/validation failure reverts the fill
        setCount((c) => (c === null ? c : Math.max(0, c - 1)));
      } else if (!isAuthenticated && !authLoading && !guestPromptSeen()) {
        markGuestPromptSeen();
        setShowGuestPrompt(true);
      }
      setBusy(false);
    });
  };

  return (
    <span className="relative inline-flex">
      <button
        onClick={tap}
        disabled={liked || busy}
        title={liked ? 'You liked this question' : 'Like this question'}
        aria-label={liked ? 'Liked' : 'Like this question'}
        aria-pressed={liked}
        className={`flex h-8 items-center gap-1 rounded-full px-2 transition-all ${
          liked
            ? 'bg-rose-100 text-rose-500 dark:bg-rose-500/20'
            : 'bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-400 dark:bg-secondary-800 dark:text-secondary-400 dark:hover:bg-rose-500/20'
        } ${busy ? 'opacity-60' : ''}`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={liked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21.2l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z" />
        </svg>
        {count !== null && count > 0 && <span className="text-[11px] font-black">{count}</span>}
      </button>

      {showGuestPrompt && (
        <span
          role="status"
          className="absolute bottom-full left-1/2 z-50 mb-2 block w-56 -translate-x-1/2 rounded-2xl bg-white p-3 text-left shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-bottom-2 duration-200 dark:bg-secondary-800 dark:ring-white/10"
        >
          <span className="block text-xs font-bold text-gray-800 dark:text-secondary-100">
            Saved as Guest ❤️
          </span>
          <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-gray-500 dark:text-secondary-400">
            Log in to keep your likes and comments on any device.
          </span>
          <span className="mt-2 flex items-center gap-2">
            <Link
              href="/login"
              onClick={dismissGuestPrompt}
              className="rounded-full bg-indigo-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-600"
            >
              Log in
            </Link>
            <button
              onClick={dismissGuestPrompt}
              className="text-[11px] font-bold uppercase tracking-wider text-gray-400 transition-colors hover:text-gray-600 dark:text-secondary-400 dark:hover:text-secondary-200"
            >
              Continue as guest
            </button>
          </span>
        </span>
      )}
    </span>
  );
}
