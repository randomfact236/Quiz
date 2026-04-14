'use client';

interface RiddleMcqHeaderProps {
  onAddRiddle: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function RiddleMcqHeader({ onAddRiddle, onImport, onExport }: RiddleMcqHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h3 className="text-lg font-semibold">🧩 Riddle MCQ Management</h3>
      <div className="flex gap-2">
        <button
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
          aria-label="Export riddles"
        >
          📥 Export
        </button>
        <button
          onClick={onImport}
          className="flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-white transition-colors hover:bg-orange-600"
          aria-label="Import riddles"
        >
          📤 Import
        </button>
        <button
          onClick={onAddRiddle}
          className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
          aria-label="Add new riddle"
        >
          + Add Riddle
        </button>
      </div>
    </div>
  );
}

export default RiddleMcqHeader;
