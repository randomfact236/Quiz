/**
 * ============================================================================
 * RiddleAnswerPanel — post-reveal panel in the riddle modal
 * ============================================================================
 * Green celebratory panel for a correct guess; neutral indigo with
 * "The answer was:" copy for give-up/time-out reveals.
 * ============================================================================
 */

'use client';

import type { ImageRiddleRevealSource } from '../hooks/useImageRiddleGame';

export interface RiddleAnswerPanelProps {
  answer: string;
  revealSource: ImageRiddleRevealSource;
  attemptCount: number;
  onNext: () => void;
}

export default function RiddleAnswerPanel({
  answer,
  revealSource,
  attemptCount,
  onNext,
}: RiddleAnswerPanelProps) {
  const isCorrect = revealSource === 'correct';

  return (
    <div className="shrink-0 animate-in zoom-in-95 duration-300 space-y-4">
      <div
        className={`p-6 sm:p-8 text-center text-white shadow-xl relative overflow-hidden rounded-[2.5rem] ${isCorrect ? 'bg-green-600' : 'bg-indigo-600'}`}
      >
        {/* Celebration burst on a correct guess */}
        {isCorrect && (
          <>
            <span className="absolute top-2 left-6 text-3xl animate-bounce">🎉</span>
            <span className="absolute bottom-2 right-8 text-2xl animate-bounce [animation-delay:150ms]">
              🎊
            </span>
            <span className="absolute top-4 right-16 text-xl animate-bounce [animation-delay:300ms]">
              ✨
            </span>
          </>
        )}
        <div className="absolute -top-10 -right-10 text-9xl opacity-10">
          {isCorrect ? '✓' : '✨'}
        </div>
        <p
          className={`mb-2 text-[10px] font-black uppercase tracking-widest ${isCorrect ? 'text-green-200' : 'text-indigo-200'}`}
        >
          {isCorrect ? 'Correct! Well guessed:' : 'The answer was:'}
        </p>
        <h3 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">{answer}</h3>
        <div
          className={`inline-flex items-center gap-2 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold ${isCorrect ? 'bg-green-500/50 text-green-50' : 'bg-indigo-500/50 text-indigo-100'}`}
        >
          <span>
            Guesses made: <span className="text-white ml-1">{attemptCount}</span>
          </span>
        </div>
      </div>
      <button
        onClick={onNext}
        className="w-full rounded-2xl bg-slate-800 py-3 sm:py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-slate-700 hover:scale-[1.02] active:scale-95"
      >
        Next Riddle →
      </button>
    </div>
  );
}
