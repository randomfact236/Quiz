'use client';

import { CheckCircle, XCircle } from 'lucide-react';

interface CSVPreviewProps {
  result: {
    success: boolean;
    count?: number;
    errors?: string[];
  };
  onClose: () => void;
}

export function CSVPreview({ result, onClose }: CSVPreviewProps) {
  return (
    <div className="text-center py-6">
      {result.success ? (
        <>
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Import Successful!
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Successfully imported {result.count} questions
          </p>
        </>
      ) : (
        <>
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Import Failed
          </h3>
          {result.errors && (
            <ul className="text-left text-sm text-red-600 dark:text-red-400 mt-2 max-h-32 overflow-y-auto">
              {result.errors.map((error, i) => (
                <li key={i} className="py-1">• {error}</li>
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
