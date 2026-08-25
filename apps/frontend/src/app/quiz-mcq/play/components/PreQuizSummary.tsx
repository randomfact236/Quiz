/**
 * Pre-quiz summary card — back link, subject info grid, add-more-questions
 * slider, mode description, start button.
 * Extracted from play/page.tsx (P1 refactor).
 */

'use client';

import Link from 'next/link';
import { ArrowLeft, Minus, Plus } from 'lucide-react';

interface PreQuizSummaryProps {
  backHref: string;
  subjectName: string;
  subjectEmoji: string;
  chapter: string;
  levelDisplay: string;
  modeDisplay: string;
  mode: string;
  finalQuestionCount: number;
  availableExtra: number;
  extraQuestions: number;
  onExtraQuestionsChange: (count: number) => void;
  onStart: () => void;
}

export function PreQuizSummary({
  backHref,
  subjectName,
  subjectEmoji,
  chapter,
  levelDisplay,
  modeDisplay,
  mode,
  finalQuestionCount,
  availableExtra,
  extraQuestions,
  onExtraQuestionsChange,
  onStart,
}: PreQuizSummaryProps): JSX.Element {
  return (
    <div className="relative flex flex-col flex-1 bg-gradient-to-b from-[#A5A3E4] to-[#BF7076]">
      <div className="relative z-10 flex flex-col flex-1 px-3 py-4">
        <div className="mx-auto w-full max-w-lg">
          {/* Back Button */}
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-white/20 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Mode Selection
          </Link>

          {/* Pre-quiz Summary Card */}
          <div className="rounded-2xl bg-white/95 p-5 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{subjectEmoji}</div>
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{subjectName} Quiz</h1>
              <p className="text-gray-500 text-sm">Ready to test your knowledge?</p>
            </div>

            {/* Quiz Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-indigo-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-indigo-600">{finalQuestionCount}</div>
                <div className="text-xs text-gray-600">Questions</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-emerald-600">{levelDisplay}</div>
                <div className="text-xs text-gray-600">Difficulty</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {mode === 'timer' ? '⏱️' : '🎯'}
                </div>
                <div className="text-xs text-gray-600">{modeDisplay}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-orange-600">{chapter}</div>
                <div className="text-xs text-gray-600">Chapter</div>
              </div>
            </div>

            {/* Add More Questions Section */}
            {availableExtra > 0 && (
              <div className="bg-purple-50 rounded-xl p-3 mb-4">
                <ExtraQuestionsPicker
                  availableExtra={availableExtra}
                  value={extraQuestions}
                  onChange={onExtraQuestionsChange}
                />
              </div>
            )}

            {/* Mode Description */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-gray-600 text-sm text-center">
                {mode === 'timer'
                  ? '⏱️ You have limited time to answer each question. Think fast!'
                  : '🎯 Take your time and answer each question carefully.'}
              </p>
            </div>

            {/* Start Button */}
            <button
              onClick={onStart}
              className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-lg font-bold rounded-xl shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all"
            >
              {extraQuestions > 0
                ? `🚀 Start Quiz (${finalQuestionCount} Questions)`
                : '🚀 Start Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExtraQuestionsPicker({
  availableExtra,
  value,
  onChange,
}: {
  availableExtra: number;
  value: number;
  onChange: (count: number) => void;
}): JSX.Element {
  const max = Math.min(20, availableExtra);
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-700 text-sm">Add More Questions:</span>
        <span className="text-xs text-purple-600">{availableExtra} more available</span>
      </div>

      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer mb-3"
      />

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="h-8 w-8 rounded-full bg-purple-200 text-purple-700 font-bold hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Minus className="h-3 w-3" />
        </button>

        <select
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="h-8 px-3 rounded-lg border border-purple-300 bg-white text-gray-700 font-semibold text-sm cursor-pointer"
        >
          {Array.from({ length: max + 1 }, (_, i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>

        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-8 w-8 rounded-full bg-purple-200 text-purple-700 font-bold hover:bg-purple-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {value > 0 && (
        <p className="text-center text-xs text-purple-600 mt-1">
          +{value} extra question{value > 1 ? 's' : ''} will be added
        </p>
      )}
    </div>
  );
}
