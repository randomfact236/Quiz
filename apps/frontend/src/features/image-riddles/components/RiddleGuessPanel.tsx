/**
 * ============================================================================
 * RiddleGuessPanel — pre-reveal gameplay area in the riddle modal
 * ============================================================================
 * Guess input with shake/wrong-answer feedback, live Attempts chip, the
 * toggleable letter-count chip, action buttons (ActionOptions), and the
 * hint panel.
 * ============================================================================
 */

'use client';

import ActionOptions from '@/components/image-riddles/ActionOptions';
import { countAnswerLetters } from '@/lib/image-riddle-answer';
import type { ImageRiddle } from '@/lib/image-riddles-api';

import type { ImageRiddleGame } from '../hooks/useImageRiddleGame';

export interface RiddleGuessPanelProps {
  riddle: ImageRiddle;
  game: ImageRiddleGame;
}

export default function RiddleGuessPanel({ riddle, game }: RiddleGuessPanelProps) {
  const attemptCount = game.attempts[riddle.id] || 0;

  return (
    <div className="shrink-0 space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="riddle-answer"
            className="block text-xs font-black uppercase tracking-widest text-slate-400"
          >
            Your Guess:
          </label>
          <div className="flex items-center gap-2">
            {attemptCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-200">
                Attempts: {attemptCount}
              </span>
            )}
            <button
              onClick={game.toggleLetterCount}
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border transition-all ${game.showLetterCount ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'}`}
              aria-pressed={game.showLetterCount}
              title="Toggle letter-count hint"
            >
              {game.showLetterCount
                ? `${countAnswerLetters(riddle.answer)} letters`
                : 'Letter count'}
            </button>
          </div>
        </div>
        <input
          id="riddle-answer"
          type="text"
          value={game.userAnswer}
          onChange={(e) => game.changeAnswer(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') game.checkAnswer();
          }}
          placeholder="Type your answer..."
          className={`w-full rounded-2xl border-2 bg-slate-50 px-6 py-4 text-lg font-bold text-slate-800 placeholder:text-slate-300 focus:bg-white focus:outline-none transition-all shadow-inner ${game.shake || game.wrongAnswer ? 'border-red-500 ring-4 ring-red-100 animate-[shake_0.5s_ease-in-out]' : 'border-slate-100 focus:border-indigo-500'}`}
          autoFocus
        />
        {game.wrongAnswer && (
          <p className="mt-2 flex items-center gap-2 text-sm font-bold text-red-600 animate-in slide-in-from-top-2 duration-300">
            <span>✗</span> Not quite — try again!
          </p>
        )}
      </div>

      <ActionOptions
        actions={game.modalActions}
        gameState={{
          isTimerRunning: false,
          isTimerPaused: false,
          isTimeUp: game.timeLeft === 0,
          isAnswerRevealed: game.showAnswer,
          hasUserAnswer: game.userAnswer.length > 0,
          timeLeft: game.timeLeft,
        }}
        position="below_question"
        onAction={game.handleAction}
        className="justify-center gap-4"
      />

      {game.shareMessage && (
        <p className="text-center text-xs font-bold text-slate-500 animate-in fade-in duration-300">
          {game.shareMessage}
        </p>
      )}

      {game.showHint && riddle.hint && (
        <div className="animate-in slide-in-from-top-4 duration-300 rounded-2xl bg-amber-50 p-5 border border-amber-100 shadow-sm">
          <p className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">
            <span className="text-base">💡</span> Hint
          </p>
          <p className="text-amber-900 font-bold">{riddle.hint}</p>
        </div>
      )}
    </div>
  );
}
