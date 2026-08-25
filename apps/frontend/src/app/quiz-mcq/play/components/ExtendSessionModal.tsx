/**
 * Extend session modal — add more questions mid-review.
 * Extracted from play/page.tsx (P1 refactor).
 */

'use client';

import { motion } from 'framer-motion';

interface ExtendSessionModalProps {
  answeredCount: number;
  totalQuestions: number;
  availableCount: number;
  additionalQuestions: number;
  onAdditionalQuestionsChange: (count: number) => void;
  onClose: () => void;
  onAddAndContinue: (count: number) => void;
}

const MAX_ADDITIONAL = 20;

export function ExtendSessionModal({
  answeredCount,
  totalQuestions,
  availableCount,
  additionalQuestions,
  onAdditionalQuestionsChange,
  onClose,
  onAddAndContinue,
}: ExtendSessionModalProps): JSX.Element {
  const clamp = (n: number) => Math.max(1, Math.min(Math.min(MAX_ADDITIONAL, availableCount), n));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-xl font-bold text-gray-800">Extend Quiz</h2>

        <div className="mb-4 space-y-3">
          <p className="text-gray-600">
            You&apos;ve answered <strong>{answeredCount}</strong> of{' '}
            <strong>{totalQuestions}</strong> questions.
          </p>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>{availableCount}</strong> more questions available in this level
            </p>
          </div>

          <p className="text-sm text-gray-500">
            How many additional questions would you like to add?
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onAdditionalQuestionsChange(clamp(additionalQuestions - 1))}
              disabled={additionalQuestions <= 1}
              className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={Math.min(MAX_ADDITIONAL, availableCount)}
              value={additionalQuestions}
              onChange={(e) => onAdditionalQuestionsChange(clamp(parseInt(e.target.value) || 1))}
              className="h-10 w-20 rounded-lg border border-gray-300 bg-white text-center font-semibold text-gray-700"
            />
            <button
              onClick={() => onAdditionalQuestionsChange(clamp(additionalQuestions + 1))}
              disabled={additionalQuestions >= Math.min(MAX_ADDITIONAL, availableCount)}
              className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              +
            </button>
          </div>

          <p className="text-xs text-gray-400">
            New questions will be added without repeating any you&apos;ve already seen.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
          >
            {availableCount > 0 ? 'Cancel' : 'Close'}
          </button>
          {availableCount > 0 ? (
            <button
              onClick={() => onAddAndContinue(additionalQuestions)}
              disabled={additionalQuestions > availableCount}
              className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              Add & Continue
            </button>
          ) : (
            <div className="flex-1 rounded-lg bg-red-50 p-2 text-center text-xs font-semibold text-red-600 border border-red-200">
              Maximum Limit Reached
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
