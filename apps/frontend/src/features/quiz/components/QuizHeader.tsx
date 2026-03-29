'use client';

interface QuizHeaderProps {
  totalQuestions: number;
  onAddQuestion: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function QuizHeader({ totalQuestions, onAddQuestion, onImport, onExport }: QuizHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">📝 Quiz MCQ Management</h3>
        <p className="text-sm text-gray-500">{totalQuestions} total questions</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
          aria-label="Export questions"
        >
          📥 Export
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
          aria-label="Import questions"
        >
          📤 Import
        </button>
        <button
          onClick={onAddQuestion}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          aria-label="Add new question"
        >
          + Add Question
        </button>
      </div>
    </div>
  );
}

export default QuizHeader;
