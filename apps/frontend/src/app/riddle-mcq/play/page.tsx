/**
 * ============================================================================
 * Riddle Play Page (Backend Connected)
 * ============================================================================
 * Main gameplay page for riddles - fetches from backend API.
 * Gameplay orchestration lives in hooks/use-riddle-play/useRiddlePlay.ts;
 * this file is render-only.
 * URL: /riddle-mcq/play?subjectId=&level=&mode=
 * ============================================================================
 */

'use client';

import { Suspense, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Timer, AlertCircle, Save, Pause, Play } from 'lucide-react';

import { useRiddlePlay } from '@/hooks/use-riddle-play/useRiddlePlay';
import { RiddleCard, type RiddleCardRef } from '../components/RiddleCard';
import { ResumePromptModal } from './components/ResumePromptModal';
import { SubmitConfirmModal } from './components/SubmitConfirmModal';
import { ExtendSessionModal } from './components/ExtendSessionModal';
import { FloatingBackground } from '@/components/quiz-mcq/FloatingBackground';
import { formatTimeMMSS } from '@/lib/utils';

// Loading component — mirrors quiz-mcq/play/page.tsx loading state exactly
function PlayPageLoading(): JSX.Element {
  return (
    <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
        <p className="text-xl font-semibold text-white">Loading riddles...</p>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function RiddlePlayPage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <p className="text-xl font-semibold text-white">Loading...</p>
          </div>
        </div>
      }
    >
      <RiddlePlayPageContent />
    </Suspense>
  );
}

function RiddlePlayPageContent(): JSX.Element {
  const searchParams = useSearchParams();

  // URL params — subjectId is canonical; chapterId kept as legacy fallback
  const subjectId = searchParams.get('subjectId') || searchParams.get('chapterId') || 'all';
  const level = searchParams.get('level') || 'all';
  const mode = (searchParams.get('mode') || 'practice') as 'timer' | 'practice';
  const chapterNameParam = searchParams.get('chapterName') || '';

  const play = useRiddlePlay({ subjectId, level, mode, chapterNameParam });

  // Refs for RiddleCard animations — UI concern, stays in the page
  const riddleCardRef = useRef<RiddleCardRef>(null);
  const shownBubblesRef = useRef<Set<string>>(new Set());

  // Determine back path
  const backPath = mode === 'timer' ? '/riddle-mcq/challenge' : '/riddle-mcq/practice';

  // Guard: not mounted yet
  if (!play.isMounted) {
    return <PlayPageLoading />;
  }

  // Error state
  if (play.error) {
    return (
      <div className="bg-gradient-to-b from-[#A5A3E4] to-[#BF7076] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href={backPath}
            className="mb-6 inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-white hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="rounded-2xl bg-white/95 p-8 text-center shadow-lg">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-yellow-500" />
            <h1 className="mb-2 text-2xl font-bold text-gray-800">Failed to Load</h1>
            <p className="mb-4 text-gray-600">{play.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white transition-colors hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (play.status === 'loading') {
    return <PlayPageLoading />;
  }

  // Resume dialog
  if (play.showResumeDialog) {
    return (
      <ResumePromptModal
        onResume={play.resumeSession}
        onStartNew={() => play.startNewSession(play.riddles)}
      />
    );
  }

  // Main playing screen — mirrors quiz-mcq/play/page.tsx layout exactly
  return (
    <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      {/* Floating Background Emojis */}
      <FloatingBackground count={20} />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col flex-1 px-4 py-2">
        <div className="mx-auto w-full max-w-5xl flex flex-col flex-1 justify-center">
          {/* Header — compact, mirrors quiz page */}
          <div className="mb-2">
            {/* Exit Button */}
            <div className="mb-1">
              <Link
                href={backPath}
                className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
              >
                <ArrowLeft className="h-4 w-4" />
                Exit Riddles
              </Link>
            </div>

            {/* Chapter info row + Timer — mirrors quiz subject + chapter + timer row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  {play.chapterName}
                </span>
                {level && level !== 'all' && (
                  <span className="text-base text-white/90 capitalize">{level}</span>
                )}
              </div>

              {/* Timer Display */}
              {play.isTimerMode && (play.status === 'playing' || play.status === 'paused') && (
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono font-bold text-sm shadow-md ${
                      play.status === 'paused'
                        ? 'bg-yellow-500 text-white'
                        : play.timeRemaining <= 10
                          ? 'bg-red-500 text-white animate-pulse'
                          : play.timeRemaining <= 20
                            ? 'bg-orange-500 text-white'
                            : 'bg-white/90 text-gray-800'
                    }`}
                  >
                    <Timer className="h-4 w-4" />
                    <span>{formatTimeMMSS(play.timeRemaining)}</span>
                    {play.status === 'paused' && <span className="ml-1 text-xs">(PAUSED)</span>}
                  </div>

                  {/* Pause/Resume Button */}
                  <button
                    onClick={play.togglePause}
                    className="rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
                    title={play.status === 'paused' ? 'Resume Timer' : 'Pause Timer'}
                  >
                    {play.status === 'paused' ? (
                      <Play className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Auto-save indicator — only shown non-timer when saved */}
              {!play.isTimerMode && play.lastSaved && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-white/60">
                  <Save className="h-3 w-3" />
                  Saved
                </div>
              )}
            </div>
          </div>

          {/* Riddle Card */}
          <AnimatePresence mode="wait">
            {play.currentRiddle && (
              <motion.div
                key={play.currentRiddle.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RiddleCard
                  ref={riddleCardRef}
                  shownBubblesRef={shownBubblesRef}
                  riddle={play.currentRiddle}
                  riddleNumber={play.currentIndex + 1}
                  totalRiddles={play.riddles.length}
                  selectedAnswer={play.answers[play.currentRiddle.id] || null}
                  onSelectAnswer={(answer) => {
                    play.handleAnswerSelect(answer);
                  }}
                  showFeedback={true}
                  disabled={play.status !== 'playing'}
                  score={play.liveScore}
                  maxScore={play.riddles.length}
                  timeUp={play.isTimeUp}
                  questionTimeRemaining={mode === 'timer' ? play.timeRemaining : undefined}
                  questionTimeLimit={
                    mode === 'timer'
                      ? Math.max(
                          1,
                          Math.round(
                            play.timeRemaining /
                              Math.max(1, play.riddles.length - play.currentIndex)
                          )
                        )
                      : undefined
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Back + N / Total + Next Navigation — mirrors quiz page exactly */}
          <div className="mt-4 flex items-center justify-between gap-4 pb-4">
            <button
              onClick={() => {
                riddleCardRef.current?.clearBubbles();
                play.handlePrevious();
              }}
              disabled={play.currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <span className="text-sm text-white/70">
              {play.currentIndex + 1} / {play.riddles.length}
            </span>

            <button
              onClick={() => {
                riddleCardRef.current?.clearBubbles();
                if (play.currentIndex >= play.riddles.length - 1) {
                  play.setShowConfirmSubmit(true);
                } else {
                  play.handleNext();
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/30"
            >
              {play.currentIndex >= play.riddles.length - 1 ? 'Submit' : 'Next'}
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Submit Modal — mirrors quiz page (2 buttons: Continue + Submit) */}
      {play.showConfirmSubmit && (
        <SubmitConfirmModal
          answeredCount={play.answeredCount}
          totalRiddles={play.riddles.length}
          onContinue={() => {
            play.setShowConfirmSubmit(false);
            play.setShowExtendSession(true);
          }}
          onSubmit={() => {
            play.handleSubmit();
            play.setShowConfirmSubmit(false);
          }}
        />
      )}

      {/* Extend Session Modal — mirrors quiz Extend Quiz modal */}
      {play.showExtendSession && (
        <ExtendSessionModal
          answeredCount={play.answeredCount}
          totalRiddles={play.riddles.length}
          additionalRiddles={play.additionalRiddles}
          onChangeAdditional={play.setAdditionalRiddles}
          onCancel={() => play.setShowExtendSession(false)}
          onConfirm={play.handleExtendSession}
        />
      )}
    </div>
  );
}
