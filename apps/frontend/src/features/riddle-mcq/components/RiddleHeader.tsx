'use client';

interface RiddleHeaderProps {
  totalRiddles: number;
  onAddRiddle: () => void;
  onImport: () => void;
  onExport: () => void;
}

export function RiddleHeader({ totalRiddles, onAddRiddle, onImport, onExport }: RiddleHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-semibold">🧩 Riddle MCQ Management</h3>
        <p className="text-sm text-gray-500">{totalRiddles} total riddles</p>
      </div>
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

export default RiddleHeader;
