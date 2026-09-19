/**
 * ============================================================================
 * LikeButton — frictionless one-tap heart on questions (BUG-037)
 * ============================================================================
 * Internal like capture: tapping sends the like once per guest (server-side
 * dedupe); the heart fills to confirm. No counts shown to players — the
 * 1/2/3+-like buckets are internal admin data (owner clarification
 * 2026-09-19). Hidden entirely when the question id is not a backend UUID
 * (sample/local-only sessions).
 * ============================================================================
 */

'use client';

import { useEffect, useState } from 'react';

import { likedByMe, likeQuestion, type QuestionLikeContentType } from '@/lib/question-likes-api';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface LikeButtonProps {
  contentType: QuestionLikeContentType;
  questionId: string;
}

export function LikeButton({ contentType, questionId }: LikeButtonProps): JSX.Element | null {
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!UUID_RE.test(questionId)) return;
    let cancelled = false;
    likedByMe(contentType, questionId).then((v) => {
      if (!cancelled && v) setLiked(true);
    });
    return () => {
      cancelled = true;
    };
  }, [contentType, questionId]);

  if (!UUID_RE.test(questionId)) return null;

  const tap = () => {
    if (liked || busy) return;
    setBusy(true);
    setLiked(true); // optimistic fill
    void likeQuestion(contentType, questionId).then((res) => {
      if (!res) setLiked(false); // network/validation failure reverts the fill
      setBusy(false);
    });
  };

  return (
    <button
      onClick={tap}
      disabled={liked || busy}
      title={liked ? 'You liked this question' : 'Like this question'}
      aria-label={liked ? 'Liked' : 'Like this question'}
      aria-pressed={liked}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
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
    </button>
  );
}
