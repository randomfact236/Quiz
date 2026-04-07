'use client';

import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Download } from 'lucide-react';
import { useQuestionMutation } from '../../hooks';
import { CSVPreview } from './CSVPreview';
import type { BulkQuestionItemDto } from '@/lib/quiz-api';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: boolean;
  count?: number;
  errors?: string[];
}

interface ParsedQuestion {
  question: string;
  optionA: string | undefined;
  optionB: string | undefined;
  optionC: string | undefined;
  optionD: string | undefined;
  correctAnswer: string;
  level: string;
  chapterName: string;
  status: string;
}

const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

const parseCSVWithSubjectHeader = (
  text: string
): { subjectName: string | undefined; questions: ParsedQuestion[] } => {
  const lines = text.trim().split(/\r?\n/);

  let subjectName: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('# Subject:')) {
      const subjectPart = trimmedLine.replace('# Subject:', '').trim();
      subjectName = subjectPart.split(',')[0]?.trim() || 'General';
    } else if (
      trimmedLine &&
      !trimmedLine.startsWith('Question,') &&
      !trimmedLine.startsWith('ID,') &&
      !trimmedLine.startsWith('#') &&
      !trimmedLine.startsWith('id,')
    ) {
      dataLines.push(trimmedLine);
    }
  }

  if (dataLines.length < 1) {
    return { subjectName: subjectName || 'General', questions: [] };
  }

  const rows = dataLines;
  const questions: ParsedQuestion[] = [];

  for (const row of rows) {
    if (!row.trim()) continue;

    const cols = parseCSVRow(row);

    // Skip ID column (col 0), start from Question (col 1)
    // Expected format: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
    if (cols.length < 9) continue;

    const question = cols[1] || '';
    const optionA = cols[2];
    const optionB = cols[3];
    const optionC = cols[4];
    const optionD = cols[5];
    const correctAnswer = cols[6] || '';
    const level = cols[7] || '';
    const chapterName = cols[8] || '';

    // Skip header rows and empty rows
    if (!question || !chapterName) continue;
    if (question === 'Question' || chapterName === 'Chapter') continue;
    if (level === 'Level') continue;

    questions.push({
      question: question.trim(),
      optionA: optionA?.trim(),
      optionB: optionB?.trim(),
      optionC: optionC?.trim(),
      optionD: optionD?.trim(),
      correctAnswer: correctAnswer?.trim() || '',
      level: level?.trim() || 'easy',
      chapterName: chapterName?.trim(),
      status: 'published',
    });
  }

  return { subjectName: subjectName || 'General', questions };
};

const downloadTemplate = () => {
  const template = `# Subject: Science

ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
1,What is H2O?,Water,Steam,Ice,Air,A,easy,Chemistry
2,What is gravity?,Force,Mass,Volume,Density,B,medium,Physics
3,How many teeth?,8,4,16,,B,hard,Mammals
4,How much water daily?,20 gallons,50 gallons,100 gallons,200 gallons,B,expert,Mammals
5,How many bones in trunk?,,,,,No Bones,extreme,Biology`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quiz_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

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
      const text = await file.text();
      const { subjectName, questions } = parseCSVWithSubjectHeader(text);

      if (questions.length === 0) {
        setResult({ success: false, errors: ['No valid questions found in CSV'] });
        return;
      }

      const payload: { questions: typeof questions } & (typeof subjectName extends string
        ? { subjectName: string }
        : {}) = {
        questions: questions.map((q) => ({
          question: q.question,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          correctAnswer: q.correctAnswer,
          level: q.level,
          chapterName: q.chapterName,
          status: q.status,
        })),
      };

      if (subjectName) {
        (payload as any).subjectName = subjectName;
      }

      await bulkCreateAsync(payload);
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['chapters'] });
      queryClient.invalidateQueries({ queryKey: ['filter-counts'] });
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      setResult({ success: true, count: questions.length });
    } catch {
      setResult({ success: false, errors: [bulkCreateError?.message || 'Import failed'] });
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Import Questions from CSV</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!result ? (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  file ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600">
                      Drag and drop a CSV file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Only .csv files are supported</p>
                  </>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-700">CSV Format:</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate();
                    }}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Download Template
                  </button>
                </div>
                <code className="text-xs text-gray-600 block overflow-x-auto whitespace-nowrap">
                  # Subject: name
                  <br />
                  Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
                </code>
              </div>

              {bulkCreateError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                  {bulkCreateError.message}
                </div>
              )}
            </>
          ) : (
            <CSVPreview result={result} onClose={handleClose} />
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || isBulkCreating}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isBulkCreating ? 'Importing...' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ImportModal;
