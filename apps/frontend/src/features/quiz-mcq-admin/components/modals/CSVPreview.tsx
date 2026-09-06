'use client';

import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ImportDuplicate {
  row: number;
  question: string;
  duplicateOfRow?: number;
}

interface CSVPreviewProps {
  result: {
    success: boolean;
    count?: number;
    total?: number;
    errors?: string[];
    duplicates?: ImportDuplicate[];
  };
  onClose: () => void;
}

export function CSVPreview({ result, onClose }: CSVPreviewProps) {
  const duplicates = result.duplicates ?? [];
  // Duplicate rows already have their own highlighted panel below.
  const otherErrors = (result.errors ?? []).filter((e) => !e.includes('Duplicate question'));

  return (
    <div className="text-center py-6">
      {result.success ? (
        <>
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Import Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Successfully imported {result.count} question{result.count === 1 ? '' : 's'}
            {result.total !== undefined && duplicates.length > 0
              ? ` · ${duplicates.length} duplicate${duplicates.length === 1 ? '' : 's'} skipped`
              : ''}
          </p>

          {duplicates.length > 0 && (
            <div className="mt-4 text-left rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20 p-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {duplicates.length} duplicate question{duplicates.length === 1 ? '' : 's'} skipped —
                already exist{duplicates.length === 1 ? 's' : ''} in this chapter/subject
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1.5">
                {duplicates.map((d) => (
                  <div key={d.row} className="text-xs text-amber-900 dark:text-amber-100">
                    <span className="font-semibold">Row {d.row}</span>
                    {d.duplicateOfRow !== undefined && (
                      <span> (duplicate of Row {d.duplicateOfRow}):</span>
                    )}
                    {d.duplicateOfRow === undefined && ':'}
                    <mark className="ml-1 rounded bg-amber-100 px-1 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-700">
                      {d.question}
                    </mark>
                  </div>
                ))}
              </div>
            </div>
          )}

          {otherErrors.length > 0 && (
            <ul className="text-left text-sm text-red-600 dark:text-red-400 mt-3 max-h-32 overflow-y-auto">
              {otherErrors.map((error, i) => (
                <li key={i} className="py-1">
                  • {error}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Import Failed</h3>
          {duplicates.length > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
              {duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'} were skipped — no
              questions were imported
            </p>
          )}
          {result.errors && result.errors.length > 0 && (
            <ul className="text-left text-sm text-red-600 dark:text-red-400 mt-2 max-h-32 overflow-y-auto">
              {result.errors.map((error, i) => (
                <li key={i} className="py-1">
                  • {error}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <button
        onClick={onClose}
        className="mt-6 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        Close
      </button>
    </div>
  );
}
