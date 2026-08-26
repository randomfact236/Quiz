'use client';

import { motion } from 'framer-motion';

interface ExtendSessionModalProps {
  answeredCount: number;
  totalRiddles: number;
  additionalRiddles: number;
  onChangeAdditional: (value: number) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** "Add more riddles" dialog shown from the submit-confirm Continue path. */
export function ExtendSessionModal({
  answeredCount,
  totalRiddles,
  additionalRiddles,
  onChangeAdditional,
  onCancel,
  onConfirm,
}: ExtendSessionModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="mb-2 text-xl font-bold text-gray-800">Extend Session</h2>

        <div className="mb-4 space-y-3">
          <p className="text-gray-600">
            You&apos;ve answered <strong>{answeredCount}</strong> of <strong>{totalRiddles}</strong>{' '}
            riddles.
          </p>

          <div className="rounded-lg bg-blue-50 p-3">
            <p className="text-sm text-blue-800">Add more riddles to keep the session going!</p>
          </div>

          <p className="text-sm text-gray-500">
            How many additional riddles would you like to add?
          </p>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onChangeAdditional(Math.max(1, additionalRiddles - 1))}
              disabled={additionalRiddles <= 1}
              className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={20}
              value={additionalRiddles}
              onChange={(e) =>
                onChangeAdditional(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))
              }
              className="h-10 w-20 rounded-lg border border-gray-300 text-center font-semibold"
            />
            <button
              onClick={() => onChangeAdditional(Math.min(20, additionalRiddles + 1))}
              disabled={additionalRiddles >= 20}
              className="h-10 w-10 rounded-lg bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              +
            </button>
          </div>

          <p className="text-xs text-gray-400">
            New riddles will be added without repeating any you&apos;ve already seen.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg bg-gray-200 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Add &amp; Continue
          </button>
        </div>
      </motion.div>
    </div>
  );
}
