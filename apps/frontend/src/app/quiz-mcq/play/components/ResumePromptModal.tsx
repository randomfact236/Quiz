/**
 * Resume prompt modal — shown when an unfinished session can be resumed.
 * Extracted from play/page.tsx (P1 refactor).
 */

interface ResumePromptModalProps {
  currentQuestionIndex: number;
  sessionSize: number;
  answeredCount: number;
  onResume: () => void;
  onStartFresh: () => void;
}

export function ResumePromptModal({
  currentQuestionIndex,
  sessionSize,
  answeredCount,
  onResume,
  onStartFresh,
}: ResumePromptModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold mb-2">Resume Quiz?</h2>
        <p className="text-gray-600 mb-1">You have an unfinished session from earlier.</p>
        <p className="text-sm text-gray-500 mb-4">
          Question <strong>{currentQuestionIndex + 1}</strong> of <strong>{sessionSize}</strong> —{' '}
          <strong>{answeredCount}</strong> answered
        </p>
        <div className="flex gap-3">
          <button
            onClick={onStartFresh}
            className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
          >
            Start Fresh
          </button>
          <button
            onClick={onResume}
            className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
          >
            Resume Q{currentQuestionIndex + 1}
          </button>
        </div>
      </div>
    </div>
  );
}
