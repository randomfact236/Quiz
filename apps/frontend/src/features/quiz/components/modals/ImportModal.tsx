'use client';

import { useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';
import { useQuestionMutation } from '../../hooks';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  count?: number;
  errors?: string[];
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { bulkCreateAsync, isBulkCreating, bulkCreateError } = useQuestionMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      // Parse CSV and create questions
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setResult({ success: false, errors: ['CSV file is empty or has no data rows'] });
        return;
      }
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
      
      const questions = [];
      const errors: string[] = [];
      
        for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const values = line.split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        
        if (!row['question'] || !row['chapter']) {
          errors.push(`Row ${i}: Missing required fields`);
          continue;
        }
        
        // Map CSV row to question DTO
        const question = {
          question: row['question'],
          chapterId: row['chapter'],
          level: (row['level'] || 'easy') as 'easy' | 'medium' | 'hard' | 'expert' | 'extreme',
          status: (row['status'] || 'draft') as 'draft' | 'published',
          options: [
            row['option_a'] || '',
            row['option_b'] || '',
            row['option_c'] || '',
            row['option_d'] || '',
          ].filter(Boolean),
          correctLetter: row['correct_answer'] || 'A',
          correctAnswer: row['option_a'] || '',
        };
        
        questions.push(question);
      }
      
      if (questions.length > 0) {
        await bulkCreateAsync(questions);
        setResult({ success: true, count: questions.length });
      } else {
        setResult({ success: false, errors: errors.length > 0 ? errors : ['No valid questions found'] });
      }
    } catch {
      setResult({ success: false, errors: [bulkCreateError?.message || 'Import failed'] });
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={open}
      onClose={handleClose}
      title="Import Questions from CSV"
      size="md"
    >
      <div className="space-y-4">
        {!result ? (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    Drag and drop a CSV file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Only .csv files are supported
                  </p>
                </>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
              <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">CSV Format:</p>
              <code className="text-xs text-gray-600 dark:text-gray-400 block">
                question,option_a,option_b,option_c,option_d,correct_answer,level,chapter,status
              </code>
            </div>

            {bulkCreateError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                {bulkCreateError.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!file || isBulkCreating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isBulkCreating ? 'Importing...' : 'Import'}
              </button>
            </div>
          </>
        ) : (
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
              onClick={handleClose}
              className="mt-6 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ImportModal;
