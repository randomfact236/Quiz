/**
 * ============================================================================
 * ImportModal — CSV/JSON import with preview table
 * ============================================================================
 */

'use client';

import type { ImageRiddle } from '@/app/admin/types';

export interface ImportModalProps {
  importPreview: ImageRiddle[];
  importError: string;
  importWarnings: string[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  modalRef: React.RefObject<HTMLDivElement>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onConfirm: () => void;
  onBack: () => void;
  onClose: () => void;
}

export default function ImportModal({
  importPreview,
  importError,
  importWarnings,
  fileInputRef,
  modalRef,
  onFileUpload,
  onConfirm,
  onBack,
  onClose,
}: ImportModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-6"
      >
        <h3 className="mb-4 text-xl font-bold">📤 Import Image Riddles</h3>

        {!importPreview.length ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                onChange={onFileUpload}
                className="hidden"
                aria-label="Upload CSV or JSON file"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600"
              >
                📁 Select CSV or JSON File
              </button>
              <p className="mt-2 text-sm text-gray-500">Supported formats: CSV, JSON</p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4 text-sm">
              <p className="mb-2 font-medium">CSV Format:</p>
              <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                Title,ImageUrl,Answer,Hint,Difficulty,Category,TimerSeconds,ShowTimer,IsActive
              </code>
              <p className="mb-2 mt-3 font-medium">JSON Format:</p>
              <code className="block overflow-x-auto rounded bg-gray-200 px-2 py-1 text-xs">
                {
                  '{"imageRiddles": [{"title": "...", "imageUrl": "...", "answer": "...", "difficulty": "medium", "category": {"name": "...", "emoji": "..."}}]}'
                }
              </code>
            </div>

            {importError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-600">⚠️ {importError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="font-medium text-green-600">
              ✓ Found {importPreview.length} image riddles to import
            </p>

            {importWarnings.length > 0 && (
              <div className="max-h-32 overflow-auto rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="mb-1 text-sm font-medium text-yellow-700">⚠️ Warnings:</p>
                {importWarnings.map((w, i) => (
                  <p
                    key={`warning-${w.slice(0, 30)}-${w.length}-${i}`}
                    className="text-xs text-yellow-600"
                  >
                    {w}
                  </p>
                ))}
              </div>
            )}

            <div className="max-h-64 overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Answer</th>
                    <th className="px-3 py-2 text-left">Difficulty</th>
                    <th className="px-3 py-2 text-left">Category</th>
                  </tr>
                </thead>
                <tbody>
                  {importPreview.slice(0, 5).map((riddle, i) => (
                    <tr
                      key={`preview-${riddle.id ?? riddle.title?.slice(0, 20)}-${i}`}
                      className="border-t"
                    >
                      <td className="max-w-xs truncate px-3 py-2">{riddle.title}</td>
                      <td className="max-w-xs truncate px-3 py-2">{riddle.answer}</td>
                      <td className="px-3 py-2">{riddle.difficulty}</td>
                      <td className="px-3 py-2">{riddle.category?.name}</td>
                    </tr>
                  ))}
                  {importPreview.length > 5 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-center text-gray-500">
                        ... and {importPreview.length - 5} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onBack}
                className="flex-1 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
              >
                Back
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
              >
                Import {importPreview.length} Riddles
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
