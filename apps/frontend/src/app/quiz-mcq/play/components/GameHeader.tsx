/**
 * Game header — exit link, subject/chapter info, skipped/unvisited buttons,
 * timer display + pause/resume control.
 * Extracted from play/page.tsx (P1 refactor).
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, Link2, Pause, Play, Timer, Zap } from 'lucide-react';

interface GameHeaderProps {
  backHref: string;
  subjectName: string;
  chapter: string;
  skippedCount: number;
  onJumpToSkipped: () => void;
  unvisitedCount: number | null;
  onDismissUnvisited: () => void;
  isTimerMode: boolean;
  quizStatus: 'loading' | 'playing' | 'paused' | 'completed';
  timeRemaining: number;
  onPauseToggle: () => void;
}

export function GameHeader({
  backHref,
  subjectName,
  chapter,
  skippedCount,
  onJumpToSkipped,
  unvisitedCount,
  onDismissUnvisited,
  isTimerMode,
  quizStatus,
  timeRemaining,
  onPauseToggle,
}: GameHeaderProps): JSX.Element {
  return (
    <div className="mb-2">
      {/* Exit Button */}
      <div className="mb-1">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Exit Quiz
        </Link>
      </div>

      {/* Subject & Chapter Info with Timer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
            {subjectName}
          </span>
          <span className="text-base text-white/90">{chapter}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Skipped Button */}
          {skippedCount > 0 && (
            <button
              onClick={onJumpToSkipped}
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-orange-600 transition-colors"
            >
              <Zap className="h-3 w-3" />
              Skipped ({skippedCount})
            </button>
          )}

          {/* Unvisited Button - Only shown when arrived via shared link and not dismissed */}
          {unvisitedCount !== null && unvisitedCount > 0 && (
            <button
              onClick={onDismissUnvisited}
              className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/90 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-purple-600 transition-colors"
            >
              <Link2 className="h-3 w-3" />
              Unvisited ({unvisitedCount})
            </button>
          )}
        </div>

        {/* Timer Display */}
        {isTimerMode && (quizStatus === 'playing' || quizStatus === 'paused') && (
          <div className="flex items-center gap-2">
            {/* Timer Clock */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono font-bold text-sm shadow-md ${
                quizStatus === 'paused'
                  ? 'bg-yellow-500 text-white'
                  : timeRemaining <= 10
                    ? 'bg-red-500 text-white animate-pulse'
                    : timeRemaining <= 20
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/90 text-gray-800'
              }`}
            >
              <Timer className="h-4 w-4" />
              <span>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </span>
              {quizStatus === 'paused' && <span className="ml-1 text-xs">(PAUSED)</span>}
            </div>

            {/* Pause/Resume Button */}
            <button
              onClick={onPauseToggle}
              className="rounded-full bg-white/20 p-1.5 text-white transition-colors hover:bg-white/30"
              title={quizStatus === 'paused' ? 'Resume Timer' : 'Pause Timer'}
            >
              {quizStatus === 'paused' ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
