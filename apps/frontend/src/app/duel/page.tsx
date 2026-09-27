/**
 * ============================================================================
 * /duel — head-to-head quiz duels (plan/18: NOW-27 slice 1 + phase 1 "duel
 * feel"). Create → share code → join → race → server-graded result.
 * Shared link format: /duel?code=<6-char code>.
 *
 * The question screen is the SOLO flow (plan/18 §3): QuestionCard +
 * AnswerOptions with the per-question countdown, the shared reveal→advance
 * pacing (useQuestionPacing) and the like·comment·share action row. Duel
 * differences only: the live opponent progress bar and the race pacing
 * (auto-advance stays on even though the duel is timed — solo timer mode
 * disables it because expiry advances instead).
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
import { getSubjects } from '@/lib/quiz-mcq-api';
import { normalizeExtremeAnswer } from '@/lib/quiz-mcq-scoring';
import { SettingsService } from '@/services/settings.service';
import { QuestionCard } from '@/components/quiz-mcq/QuestionCard';
import ShareMenu from '@/components/share/ShareMenu';
import { useQuestionPacing } from '@/hooks/useQuestionPacing';
import type { Question } from '@/types/quiz-mcq';

type Phase = 'lobby' | 'joining' | 'waiting' | 'playing' | 'finished';

const LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'] as const;

/** Same fallback table as solo timer mode (quiz-mcq/play) — settings win. */
const DEFAULT_TIME_LIMITS: Record<string, number> = {
  easy: 30,
  medium: 45,
  hard: 60,
  expert: 90,
  extreme: 120,
};

/** DuelQuestion (plain options array) → the quiz Question shape the shared
 *  card renders. The key stays empty: verdicts arrive per answer. */
function adaptQuestion(q: DuelQuestion): Question {
  return {
    id: q.id,
    question: q.question,
    optionA: q.options[0] ?? '',
    optionB: q.options[1] ?? '',
    optionC: q.options[2] ?? '',
    optionD: q.options[3] ?? '',
    correctAnswer: '',
    correctLetter: null,
    level: (LEVELS as readonly string[]).includes(q.level)
      ? (q.level as Question['level'])
      : 'medium',
  };
}

/** Option TEXT for a served letter (review view). */
function optionText(item: { options: string[] }, letter: string | null | undefined): string | null {
  if (!letter) return null;
  const idx = letter.toUpperCase().charCodeAt(0) - 65;
  return item.options[idx] ?? null;
}

interface SubjectChip {
  id: string;
  name: string;
  emoji?: string | null;
}

export default function DuelPage(): JSX.Element {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get('code') || '';

  const [phase, setPhase] = useState<Phase>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [level, setLevel] = useState<string>('medium');
  const [joinCode, setJoinCode] = useState(urlCode);
  const [activeCode, setActiveCode] = useState('');
  const [duelLevel, setDuelLevel] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [poll, setPoll] = useState<DuelPoll | null>(null);
  const [error, setError] = useState('');
  // BUG (2026-09-25): the auto-joiner was never asked for a name (joined as
  // "Guest") and the invite was a plain text literal (typed by hand on a phone).
  const [joinGate, setJoinGate] = useState(''); // code awaiting a name
  const [copied, setCopied] = useState(false);
  const [shareQuestionId, setShareQuestionId] = useState<string | null>(null);
  // Subject filter (plan/18 §10 step 5): '' = all subjects.
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState<SubjectChip[]>([]);
  const [levelTimers, setLevelTimers] = useState<Record<string, number> | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const guestRef = useRef<string>('');
  const picksCountRef = useRef(0);
  const expiredRef = useRef<string | null>(null);

  const guest = () => {
    if (!guestRef.current) guestRef.current = getGuestId();
    return guestRef.current;
  };

  // Lobby chips: the same subject feed the homepage topics use.
  useEffect(() => {
    getSubjects(false)
      .then((rows) =>
        setSubjects(rows.map((s) => ({ id: s.id, name: s.name, emoji: s.emoji ?? null })))
      )
      .catch(() => undefined);
    // Timer settings — same source solo timer mode uses.
    SettingsService.getSettings()
      .then((settings) => {
        const timers = settings.quiz?.defaults?.levelTimers;
        setLevelTimers((timers as Record<string, number> | undefined) ?? null);
      })
      .catch(() => setLevelTimers(null));
  }, []);

  const subjectLabel =
    subjectId === ''
      ? 'all subjects'
      : (subjects.find((s) => s.id === subjectId)?.name ?? 'a subject');
  const subjectEmoji =
    subjectId === '' ? '⚔️' : (subjects.find((s) => s.id === subjectId)?.emoji ?? '⚔️');
  const timeLimit = duelLevel
    ? (levelTimers?.[duelLevel] ?? DEFAULT_TIME_LIMITS[duelLevel] ?? 45)
    : null;

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
        setDuelLevel(view.level);
        try {
          window.localStorage.setItem('pigzap:duel-code', code);
        } catch (e) {
          /* private mode — resume is best-effort */
        }
        setQuestions(view.questions.map(adaptQuestion));
        setIndex(0);
        setPicks({});
        picksCountRef.current = 0;
        expiredRef.current = null;
        setScore(0);
        setTimeRemaining(null);
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
        subjectId: subjectId || null,
      });
      setActiveCode(code);
      setDuelLevel(level);
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
  }, [level, playerName, subjectId]);

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
  // the result can resolve. Periodic heartbeat refreshes `lastPolledAt` so a
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
          void sendDuelProgress(activeCode, guest(), picksCountRef.current).catch(() => undefined);
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
  }, [phase, activeCode]);

  const current = questions[index];
  const currentId = current?.id ?? null;

  // Race pacing: advance after the last question → finish + revealed result.
  const advance = useCallback(async () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setTimeRemaining(null); // next question's timer effect sets it fresh
      return;
    }
    setPhase('finished');
    setTimeRemaining(null);
    try {
      setPoll(await finishDuel(activeCode, guest()));
    } catch {
      // leave the finished screen with local score only
    }
  }, [activeCode, index, questions.length]);

  const pacing = useQuestionPacing({
    questionId: currentId,
    advanceMs: 3000,
    enabled: phase === 'playing',
    onAdvance: () => {
      void advance();
    },
  });

  // Per-question countdown — the same per-level limits solo timer mode uses.
  // Expiry advances WITHOUT a server call: the question stays unanswered
  // (never graded wrong) and the opponent's "completed" count just doesn't
  // move for it.
  useEffect(() => {
    if (phase !== 'playing' || currentId === null || timeLimit == null) {
      setTimeRemaining(null);
      return;
    }
    setTimeRemaining(timeLimit);
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev === null ? prev : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, currentId, timeLimit]);

  useEffect(() => {
    if (phase !== 'playing' || currentId === null || timeRemaining !== 0) return;
    if (picks[currentId] !== undefined) return;
    if (expiredRef.current === currentId) return;
    expiredRef.current = currentId;
    void advance();
  }, [phase, currentId, timeRemaining, picks, advance]);

  // Submit a pick (letter, or typed text on extreme) — the server grades; the
  // verdict + explanation attach to the question exactly like solo play.
  const submitAnswer = useCallback(
    async (answer: string) => {
      if (phase !== 'playing' || !current || picks[current.id] !== undefined) return;
      const questionId = current.id;
      setPicks((prev) => ({ ...prev, [questionId]: answer }));
      picksCountRef.current += 1;
      try {
        const result = await sendDuelAnswer(activeCode, {
          guestId: guest(),
          questionId,
          selected: answer,
        });
        if (result.correct) setScore((s) => s + 1);
        setQuestions((qs) =>
          qs.map((q) =>
            q.id === questionId
              ? {
                  ...q,
                  verdict: result.correct,
                  explanation: q.explanation ?? result.explanation,
                  ...(q.level === 'extreme' && result.correctAnswer
                    ? { correctAnswer: result.correctAnswer }
                    : {}),
                }
              : q
          )
        );
      } catch {
        // Grading unavailable — count it as answered-not-correct and move on.
        setQuestions((qs) => qs.map((q) => (q.id === questionId ? { ...q, verdict: false } : q)));
      } finally {
        pacing.scheduleAdvance();
      }
    },
    [activeCode, current, pacing, phase, picks]
  );

  // BUG-040 parity: closing the comments panel proceeds only if the question
  // was answered; otherwise it just closes.
  const proceedAfterComments = useCallback(() => {
    pacing.closeComments();
    const id = questions[index]?.id;
    if (id !== undefined && picks[id] !== undefined) void advance();
  }, [advance, index, pacing, picks, questions]);

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

  const shareQuestion = shareQuestionId
    ? (questions.find((q) => q.id === shareQuestionId) ?? null)
    : null;
  const total = questions.length;
  const meDone = poll?.me?.completed ?? picksCountRef.current;
  const opponentDone = poll?.opponent?.completed ?? 0;
  const opponentName = poll?.opponent?.playerName || 'Opponent';

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
            <div className="mb-2 flex flex-wrap gap-2">
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
            <p className="mt-3 mb-1 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-secondary-400">
              Subject (optional)
            </p>
            <div className="mb-2 flex flex-wrap gap-2">
              <button
                onClick={() => setSubjectId('')}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                  subjectId === ''
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600'
                }`}
              >
                All subjects
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                    subjectId === s.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 dark:bg-secondary-700 dark:text-secondary-300 dark:hover:bg-secondary-600'
                  }`}
                >
                  {s.emoji ? `${s.emoji} ` : ''}
                  {s.name}
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
            <p className="mt-2 text-gray-600 dark:text-secondary-300">
              {duelLevel ? `${duelLevel.charAt(0).toUpperCase()}${duelLevel.slice(1)} · ` : ''}
              {subjectLabel} — send them this link:
            </p>
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
                        text: `Can you beat my ${subjectLabel} quiz? Code ${activeCode}`,
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
          <>
            {/* Live race: both laps fed by the 3-s poll. */}
            <div className="mb-4 rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-secondary-800/70">
              <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-gray-600 dark:text-secondary-300">
                <span>
                  You — {meDone}/{total}
                </span>
                <span>
                  {opponentName} — {opponentDone}/{total}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-secondary-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-500 transition-all duration-500"
                    style={{ width: `${total > 0 ? Math.min(100, (meDone / total) * 100) : 0}%` }}
                  />
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-secondary-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 transition-all duration-500"
                    style={{
                      width: `${total > 0 ? Math.min(100, (opponentDone / total) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <QuestionCard
              key={current.id}
              question={current}
              questionNumber={index + 1}
              totalQuestions={total}
              selectedAnswer={picks[current.id] ?? null}
              onSelectAnswer={(answer) => void submitAnswer(answer)}
              showFeedback={true}
              disabled={phase !== 'playing'}
              subjectEmoji={subjectEmoji}
              score={score}
              maxScore={total}
              timeUp={timeRemaining === 0}
              onShare={() => setShareQuestionId(current.id)}
              commentsOpen={pacing.commentsOpen}
              onToggleComments={pacing.toggleComments}
              onCloseComments={proceedAfterComments}
              {...(timeRemaining !== null && timeLimit
                ? { questionTimeRemaining: timeRemaining, questionTimeLimit: timeLimit }
                : {})}
            />

            {shareQuestion && (
              <ShareMenu
                title={`Quiz question ${index + 1}`}
                text={shareQuestion.question}
                url={`${SITE_URL}/quiz-mcq/play?subject=all&chapter=all&level=${duelLevel || 'medium'}&mode=normal&shared=true&total=${total}&qid=${shareQuestion.id}`}
                countKey={{ contentType: 'quiz-question', contentId: shareQuestion.id }}
                onClose={() => setShareQuestionId(null)}
              />
            )}
          </>
        )}

        {phase === 'finished' && (
          <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-secondary-800">
            <div className="text-center">
              <p className="text-4xl">⚔️</p>
              <h2 className="mt-3 text-2xl font-black text-gray-800 dark:text-secondary-100">
                Duel complete — {score}/{total}
              </h2>
              {poll?.opponent ? (
                <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-secondary-300">
                  <p className="font-bold">
                    {opponentName}: {poll.opponent.correct ?? '—'}/
                    {poll.status === 'running' ? `done · ${poll.opponent.completed}` : total}
                  </p>
                  {poll.status !== 'running' &&
                    (poll.me.durationMs || poll.opponent.durationMs) && (
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
            </div>

            {/* Per-question review (plan/18 §10 step 4): your pick vs the
                correct answer + explanation, from the post-resolution reveal.
                Picks only exist for matches finished in this view — a resumed
                finished match shows the reveal without your answers. */}
            {poll?.reveal && poll.reveal.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-black uppercase tracking-widest text-gray-500 dark:text-secondary-400">
                  Review
                </h3>
                <div className="space-y-2">
                  {poll.reveal.map((item, i) => {
                    const myPick = picks[item.id];
                    const myText = myPick ? (optionText(item, myPick) ?? myPick) : null;
                    const correctText = optionText(item, item.correctLetter) ?? item.correctAnswer;
                    const myCorrect =
                      myPick !== undefined &&
                      (item.correctLetter
                        ? myPick.toUpperCase() === item.correctLetter.toUpperCase()
                        : correctText !== null &&
                          normalizeExtremeAnswer(myPick) === normalizeExtremeAnswer(correctText));
                    return (
                      <details
                        key={item.id}
                        className="rounded-xl border border-slate-100 px-4 py-3 dark:border-secondary-700"
                      >
                        <summary className="cursor-pointer text-sm font-semibold text-gray-700 dark:text-secondary-200">
                          {i + 1}. {item.question}
                        </summary>
                        <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-secondary-300">
                          {myText !== null && (
                            <p>
                              <span className="font-bold">Your answer:</span>{' '}
                              <span className="font-semibold">
                                {myCorrect ? '✓' : '✕'} {myText}
                              </span>
                            </p>
                          )}
                          {correctText && (
                            <p>
                              <span className="font-bold">Correct:</span> {correctText}
                            </p>
                          )}
                          {item.explanation && (
                            <p className="mt-1 rounded-lg bg-indigo-50/70 px-3 py-2 dark:bg-indigo-500/10">
                              💡 {item.explanation}
                            </p>
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
              </div>
            )}

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
                  setPicks({});
                  picksCountRef.current = 0;
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
