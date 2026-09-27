/**
 * ============================================================================
 * /duel — head-to-head riddle/quiz duels (NOW-09, frontend for the existing
 * duels backend: create → share code → join → race → server-graded result).
 * Shared link format: /duel?code=<6-char code>.
 * ============================================================================
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Swords } from 'lucide-react';

import { getGuestId } from '@/lib/guest-id';
import {
  createDuel,
  finishDuel,
  joinDuel,
  pollDuel,
  sendDuelAnswer,
  sendDuelProgress,
  type DuelPoll,
  type DuelQuestion,
} from '@/lib/duels-api';
import { SITE_URL } from '@/lib/site-url';
import { toast } from '@/lib/toast';

type Phase = 'lobby' | 'joining' | 'waiting' | 'playing' | 'finished' | 'error';

const LEVELS = ['easy', 'medium', 'hard'] as const;

export default function DuelPage(): JSX.Element {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get('code') || '';

  const [phase, setPhase] = useState<Phase>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [level, setLevel] = useState<string>('medium');
  const [joinCode, setJoinCode] = useState(urlCode);
  const [activeCode, setActiveCode] = useState('');
  const [questions, setQuestions] = useState<DuelQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [poll, setPoll] = useState<DuelPoll | null>(null);
  const [error, setError] = useState('');
  // BUG (2026-09-25): the auto-joiner was never asked for a name (joined as
  // "Guest") and the invite was a plain text literal (typed by hand on a phone).
  const [joinGate, setJoinGate] = useState(''); // code awaiting a name
  const [copied, setCopied] = useState(false);
  const guestRef = useRef<string>('');

  const guest = () => {
    if (!guestRef.current) guestRef.current = getGuestId();
    return guestRef.current;
  };

  // Join (or re-join) a shared match and enter the race.
  const doJoin = useCallback(
    async (code: string, nameOverride?: string) => {
      setPhase('joining');
      setError('');
      try {
        const view = await joinDuel(code, {
          playerName: (nameOverride ?? playerName).trim() || 'Guest',
          guestId: guest(),
        });
        setActiveCode(code);
        try {
          window.localStorage.setItem('pigzap:duel-code', code);
        } catch (e) {
          /* private mode — resume is best-effort */
        }
        setQuestions(view.questions);
        setIndex(0);
        setPicked(null);
        setScore(0);
        setPhase('playing');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not join that duel.');
        setPhase('lobby');
      }
    },
    [playerName]
  );

  // Create a match and wait for an opponent.
  const doCreate = useCallback(async () => {
    setPhase('joining');
    setError('');
    try {
      const { code } = await createDuel({
        level,
        questionCount: 10,
        playerName: playerName.trim() || 'Guest',
        guestId: guest(),
      });
      setActiveCode(code);
      try {
        window.localStorage.setItem('pigzap:duel-code', code);
      } catch (e) {
        /* private mode — resume is best-effort */
      }
      setPhase('waiting');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the duel.');
      setPhase('lobby');
    }
  }, [level, playerName]);

  // Waiting: poll until the opponent joins (status flips to running), then
  // claim our own question view by "joining" our own match (idempotent).
  useEffect(() => {
    if (phase !== 'waiting' || !activeCode) return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const view = await pollDuel(activeCode, guest());
        if (view.opponent && !stopped) {
          stopped = true;
          await doJoin(activeCode);
        }
      } catch {
        // transient — keep polling
      }
    }, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [phase, activeCode, doJoin]);

  // Playing/finished: keep the poll alive so the opponent's progress shows and
  // the result can resolve. 10-second heartbeat refreshes `lastPolledAt` so a
  // backgrounded phone doesn't trip the 30-second silence rule mid-race.
  useEffect(() => {
    if ((phase !== 'playing' && phase !== 'finished') || !activeCode) return;
    let stopped = false;
    let ticks = 0;
    const tick = async () => {
      if (stopped) return;
      try {
        const view = await pollDuel(activeCode, guest());
        if (!stopped) setPoll(view);
        // heartbeat every 3rd tick (~9s): survives tab backgrounding
        ticks += 1;
        if (phase === 'playing' && ticks % 3 === 0) {
          void sendDuelProgress(activeCode, guest(), index).catch(() => undefined);
        }
      } catch {
        /* transient — keep polling */
      }
    };
    void tick();
    const timer = setInterval(tick, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
    // index intentionally omitted: the heartbeat sends the latest count via a ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, activeCode, index]);

  const current = questions[index];

  const answer = useCallback(
    async (selected: string) => {
      const question = questions[index];
      if (!question || picked !== null) return;
      setPicked(selected);
      try {
        const result = await sendDuelAnswer(activeCode, {
          guestId: guest(),
          questionId: question.id,
          selected,
        });
        setLastCorrect(result.correct);
        if (result.correct) setScore((s) => s + 1);
      } catch {
        setLastCorrect(false);
      }
    },
    [activeCode, index, picked, questions]
  );

  const next = useCallback(async () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setPicked(null);
      setLastCorrect(null);
      return;
    }
    // Done — finish and show the revealed comparison.
    setPhase('finished');
    try {
      const view = await finishDuel(activeCode, guest());
      setPoll(view);
    } catch {
      // leave the finished screen with local score only
    }
  }, [activeCode, index, questions]);

  // Shared link (?code=) → ask for a name, then join (a phone joiner must not
  // land as a nameless "Guest").
  useEffect(() => {
    if (urlCode && !joinGate && phase === 'lobby') {
      setJoinCode(urlCode);
      setJoinGate(urlCode);
      setPhase('joining');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode, phase, joinGate]);

  // Refresh resilience: re-link to a match this device was in. A `waiting`
  // match resumes cleanly; a `finished` one shows the result; a `running` one
  // cannot (the backend only serves the frozen question set to the join call)
  // — we say so instead of silently failing.
  useEffect(() => {
    if (urlCode || phase !== 'lobby') return;
    let stored = '';
    try {
      stored = window.localStorage.getItem('pigzap:duel-code') || '';
    } catch (e) {
      return;
    }
    if (!stored) return;
    let cancelled = false;
    void pollDuel(stored, guest())
      .then((view) => {
        if (cancelled) return;
        if (view.status === 'waiting') {
          setActiveCode(stored);
          setPhase('waiting');
        } else if (view.status === 'finished' || view.status === 'abandoned') {
          setActiveCode(stored);
          setPoll(view);
          setPhase('finished');
        } else {
          try {
            window.localStorage.removeItem('pigzap:duel-code');
          } catch (e) {
            /* ignore */
          }
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode, phase]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E8E4F3] to-[#D4C5E8] px-4 py-8 dark:from-indigo-950 dark:to-rose-950/70">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/play"
          className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/40 px-4 py-2 text-gray-700 transition-all hover:bg-white hover:shadow-md dark:bg-secondary-800/40 dark:text-secondary-200 dark:hover:bg-secondary-700/60"
        >
          ← Play Hub
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md">
            <Swords className="h-6 w-6" />
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-800 dark:text-secondary-100">
            Duel
          </h1>
        </div>

        {phase === 'lobby' && (
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-secondary-800">
            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-secondary-200">
              Your name
            </label>
            <input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              placeholder="Guest"
              className="mb-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-gray-800 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
            />

            <h2 className="mb-3 text-lg font-black text-gray-800 dark:text-secondary-100">
              Create a duel
            </h2>
            <div className="mb-2 flex gap-2">
              {LEVELS.map((lv) => (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  className={`flex-1 rounded-xl px-3 py-3 text-sm font-black uppercase tracking-widest transition-colors ${
                    level === lv
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600'
                  }`}
                >
                  {lv}
                </button>
              ))}
            </div>
            <p className="mb-4 text-xs text-gray-500 dark:text-secondary-400">
              10 questions · same set for both players · fastest correct run wins
            </p>
            <button
              onClick={() => void doCreate()}
              className="w-full rounded-xl bg-rose-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white shadow-md transition-colors hover:bg-rose-500"
            >
              Create duel &amp; get invite code
            </button>

            <div className="my-6 flex items-center gap-3 text-gray-400 dark:text-secondary-400">
              <span className="h-px flex-1 bg-gray-200 dark:bg-secondary-700" />
              or join with a code
              <span className="h-px flex-1 bg-gray-200 dark:bg-secondary-700" />
            </div>
            <div className="flex gap-2">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="CODE"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-mono text-lg uppercase tracking-widest text-gray-800 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
              />
              <button
                onClick={() => joinCode.trim() && void doJoin(joinCode.trim())}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
              >
                Join
              </button>
            </div>
            {error && (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-300">
                {error}
              </p>
            )}
          </div>
        )}

        {phase === 'joining' && !joinGate && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-secondary-800">
            <p className="text-gray-500 dark:text-secondary-300">Connecting…</p>
          </div>
        )}

        {phase === 'joining' && joinGate && (
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-secondary-800">
            <h2 className="mb-1 text-xl font-black text-gray-800 dark:text-secondary-100">
              You&apos;ve been invited to a duel
            </h2>
            <p className="mb-4 text-sm text-gray-600 dark:text-secondary-300">
              Code{' '}
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-300">
                {joinGate}
              </span>{' '}
              · same questions for both players, fastest correct run wins.
            </p>
            <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-secondary-200">
              Your name
            </label>
            <input
              autoFocus
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={24}
              placeholder="Guest"
              className="mb-5 w-full rounded-xl border border-slate-200 px-4 py-3 text-gray-800 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-100"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const code = joinGate;
                  setJoinGate('');
                  void doJoin(code, playerName);
                }}
                className="flex-1 rounded-xl bg-rose-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-rose-500"
              >
                Accept the duel
              </button>
              <Link
                href="/play"
                className="rounded-xl bg-slate-100 px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-200 dark:bg-secondary-700 dark:text-secondary-300"
              >
                Not now
              </Link>
            </div>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-secondary-800">
            <p className="text-4xl">⏳</p>
            <h2 className="mt-3 text-xl font-black text-gray-800 dark:text-secondary-100">
              Waiting for a challenger
            </h2>
            <p className="mt-2 text-gray-600 dark:text-secondary-300">Send them this link:</p>
            <p className="my-3 break-all font-mono text-lg font-black text-indigo-600 dark:text-indigo-300">
              {SITE_URL}/duel?code={activeCode}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={async () => {
                  const url = `${SITE_URL}/duel?code=${activeCode}`;
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (e) {
                    toast.error('Copy failed — long-press the link above');
                  }
                }}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
              >
                {copied ? '✓ Link copied' : '🔗 Copy link'}
              </button>
              <button
                onClick={async () => {
                  const url = `${SITE_URL}/duel?code=${activeCode}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({
                        title: 'Duel me on PigZap',
                        text: `Can you beat my quiz? Code ${activeCode}`,
                        url,
                      });
                      return;
                    } catch (e) {
                      /* dismissed — fall through to copy */
                    }
                  }
                  try {
                    await navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch (err) {
                    toast.error('Copy failed — long-press the link above');
                  }
                }}
                className="rounded-xl bg-rose-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-rose-500"
              >
                📤 Share
              </button>
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-secondary-400">
              Waiting code: <span className="font-mono font-bold">{activeCode}</span>
            </p>
          </div>
        )}

        {phase === 'playing' && current && (
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-secondary-800">
            <div className="mb-4 flex items-center justify-between text-sm text-gray-500 dark:text-secondary-400">
              <span>
                Question {index + 1} of {questions.length}
              </span>
              <span>Score: {score}</span>
            </div>
            {poll?.opponent && (
              <p className="mb-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 dark:bg-secondary-700 dark:text-secondary-300">
                {poll.opponent.playerName || 'Opponent'}: {poll.opponent.completed}/
                {questions.length} answered
              </p>
            )}
            <p className="mb-5 text-lg font-semibold text-gray-800 dark:text-secondary-100">
              {current.question}
            </p>
            <div className="space-y-3">
              {current.options.map((option, i) => {
                const letter = 'ABCDEFGH'[i] ?? String(i);
                return (
                  <button
                    key={option}
                    disabled={picked !== null}
                    onClick={() => void answer(letter)}
                    className={`w-full rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors ${
                      picked === letter
                        ? lastCorrect === true
                          ? 'border-green-500 bg-green-50 text-green-800 dark:bg-green-500/10 dark:text-green-300'
                          : lastCorrect === false
                            ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                            : 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200'
                        : 'border-slate-200 bg-white text-gray-700 hover:border-indigo-300 dark:border-secondary-600 dark:bg-secondary-900 dark:text-secondary-200 dark:hover:border-secondary-500'
                    }`}
                  >
                    <span className="mr-2 font-black">{letter}.</span>
                    {option}
                  </button>
                );
              })}
            </div>
            {picked !== null && lastCorrect !== null && (
              <button
                onClick={() => (index + 1 < questions.length ? setIndex(index + 1) : void next())}
                className="mt-5 w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
              >
                {index + 1 < questions.length ? 'Next question' : 'See result'}
              </button>
            )}
          </div>
        )}

        {phase === 'finished' && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-secondary-800">
            <p className="text-4xl">⚔️</p>
            <h2 className="mt-3 text-2xl font-black text-gray-800 dark:text-secondary-100">
              Duel complete — {score}/{questions.length}
            </h2>
            {poll?.opponent ? (
              <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-secondary-300">
                <p className="font-bold">
                  {poll.opponent.playerName || 'Opponent'}: {poll.opponent.correct ?? '—'}/
                  {poll.status === 'running'
                    ? `done · ${poll.opponent.completed}`
                    : questions.length}
                </p>
                {poll.status !== 'running' && (poll.me.durationMs || poll.opponent.durationMs) && (
                  <p className="text-xs text-gray-500 dark:text-secondary-400">
                    {Math.round((poll.me.durationMs ?? 0) / 1000)}s vs{' '}
                    {Math.round((poll.opponent.durationMs ?? 0) / 1000)}s
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500 dark:text-secondary-400">
                Solo finish — no opponent joined.
              </p>
            )}
            <p className="mt-4 text-sm font-bold text-gray-700 dark:text-secondary-200">
              {poll?.status === 'running' || !poll?.opponent
                ? 'Waiting for the opponent to finish…'
                : (poll.me.correct ?? 0) > (poll.opponent.correct ?? 0)
                  ? '🏆 You win!'
                  : (poll.opponent.correct ?? 0) > (poll.me.correct ?? 0)
                    ? 'Close one — rematch?'
                    : 'Dead heat — a draw.'}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  try {
                    window.localStorage.removeItem('pigzap:duel-code');
                  } catch (e) {
                    /* ignore */
                  }
                  setPhase('lobby');
                  setActiveCode('');
                  setPoll(null);
                  setQuestions([]);
                  setIndex(0);
                  setScore(0);
                  setPicked(null);
                }}
                className="rounded-xl bg-rose-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-rose-500"
              >
                New duel
              </button>
              <Link
                href="/play"
                className="inline-block rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black uppercase tracking-widest text-white transition-colors hover:bg-indigo-500"
              >
                Back to Play Hub
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
