'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Upload, FileText, Download } from 'lucide-react';
import { bulkCreateRiddles } from '@/lib/riddle-mcq-api';
import type { CreateRiddleMcqDto, RiddleSubject } from '@/lib/riddle-mcq-api';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subjects: RiddleSubject[];
}

interface ParsedRiddle {
  question: string;
  options: string[];
  correctLetter: string;
  level: string;
  subjectName: string;
  hint: string;
  explanation: string;
  answer: string;
  status: string;
}

interface ImportError {
  row: number;
  message: string;
}

interface ImportResult {
  success: boolean;
  count?: number;
  errors?: ImportError[];
}

const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of row) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const downloadTemplate = () => {
  const template = `# Category: Logic

#,question,optionA,optionB,optionC,optionD,answer,level,subject,hint,explanation,status
1,"What has keys but no locks?","A piano","A keyboard","A map","A door","B. A keyboard","easy","Logic Puzzles","Think about instruments","Keyboards have keys but no locks","published"
2,"I speak without a mouth","An echo","A ghost","A shadow","A mirror","A. An echo","medium","Logic Puzzles","Think about sound","Echoes repeat sounds","published"`;

  const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'riddle_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function ImportModal({ open, onClose, onSuccess, subjects }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRiddle[]>([]);
  const [allRiddles, setAllRiddles] = useState<ParsedRiddle[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const subjectNameToId = useCallback(
    (name: string, categoryId?: string | null): string | null => {
      const subject = subjects.find((s) => {
        const nameMatch =
          s.name.toLowerCase() === name.toLowerCase() ||
          s.slug.toLowerCase() === name.toLowerCase();
        if (categoryId) {
          return nameMatch && s.categoryId === categoryId;
        }
        return nameMatch;
      });
      return subject?.id ?? null;
    },
    [subjects]
  );

  const parseCsvContent = useCallback((content: string): ParsedRiddle[] => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    let headerLineIdx = 0;
    let dataStartIdx = 1;

    if (lines[0]?.startsWith('# Category:')) {
      headerLineIdx = 1;
      dataStartIdx = 2;
    }

    const headers = parseCSVRow(lines[headerLineIdx]!).map((h) => h.toLowerCase().trim());
    const riddles: ParsedRiddle[] = [];

    for (let i = dataStartIdx; i < lines.length; i++) {
      const line = lines[i]!.trim();
      if (!line) continue;

      if (line.startsWith('#')) continue;

      const values = parseCSVRow(line);
      if (values.length < 2) continue;

      const getValue = (colName: string): string => {
        const idx = headers.indexOf(colName.toLowerCase());
        return idx >= 0 && values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
      };

      const question = getValue('question');
      if (!question) continue;

      const optA = getValue('optiona');
      const optB = getValue('optionb');
      const optC = getValue('optionc');
      const optD = getValue('optiond');

      const answerRaw = getValue('answer');

      let correctLetter = '';
      let answerText = '';

      if (answerRaw) {
        const letterMatch = answerRaw.match(/^([A-D])\.\s*(.*)$/i);
        if (letterMatch) {
          correctLetter = letterMatch[1]!.toUpperCase();
          answerText = letterMatch[2]!.trim();
        } else {
          answerText = answerRaw;
        }
      }

      let options: string[] = [];
      if (optA) options.push(optA);
      if (optB) options.push(optB);
      if (optC) options.push(optC);
      if (optD) options.push(optD);

      if (answerText && correctLetter) {
        const letterIndex = correctLetter.charCodeAt(0) - 65;
        if (letterIndex >= 0 && letterIndex < options.length) {
          options[letterIndex] = answerText;
        }
      }

      riddles.push({
        question,
        options,
        correctLetter,
        level: getValue('level') || 'easy',
        subjectName: getValue('subject'),
        hint: getValue('hint'),
        explanation: getValue('explanation'),
        answer: answerText || '',
        status: getValue('status') || 'draft',
      });
    }

    return riddles;
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setErrors([]);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = parseCsvContent(content);
          setAllRiddles(parsed);
          setPreview(parsed.slice(0, 5));
          if (parsed.length === 0) {
            setErrors([{ row: 0, message: 'No valid riddles found in CSV' }]);
          }
        } catch {
          setErrors([{ row: 0, message: 'Failed to parse CSV file' }]);
        }
      };
      reader.readAsText(selectedFile);
    },
    [parseCsvContent]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  const handleImport = useCallback(async () => {
    if (allRiddles.length === 0) return;

    setIsImporting(true);
    setErrors([]);
    setProgress(0);

    const CHUNK_SIZE = 100;
    const riddlesWithSubjectId: CreateRiddleMcqDto[] = [];
    const validationErrors: ImportError[] = [];

    for (let i = 0; i < allRiddles.length; i++) {
      const r = allRiddles[i]!;
      const subjectId = subjectNameToId(r.subjectName);

      if (!subjectId) {
        validationErrors.push({ row: i + 2, message: `Subject "${r.subjectName}" not found` });
        continue;
      }

      const dto: CreateRiddleMcqDto = {
        question: r.question,
        options: r.options.length > 0 ? r.options : [],
        level: r.level as CreateRiddleMcqDto['level'],
        subjectId,
        status: (r.status as CreateRiddleMcqDto['status']) || 'draft',
        importOrder: i + 1,
      };

      if (r.correctLetter) dto.correctLetter = r.correctLetter;
      if (r.answer && r.level === 'expert') dto.answer = r.answer;
      if (r.hint) dto.hint = r.hint;
      if (r.explanation) dto.explanation = r.explanation;

      riddlesWithSubjectId.push(dto);
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsImporting(false);
      return;
    }

    const allErrors: ImportError[] = [];
    let totalCreated = 0;

    try {
      for (let i = 0; i < riddlesWithSubjectId.length; i += CHUNK_SIZE) {
        const chunk = riddlesWithSubjectId.slice(i, i + CHUNK_SIZE);
        const result = await bulkCreateRiddles(chunk);

        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err, idx) => {
            allErrors.push({ row: i + idx + 2, message: err });
          });
        }
        totalCreated += result.count;
        setProgress(Math.min(((i + CHUNK_SIZE) / riddlesWithSubjectId.length) * 100, 100));
      }

      if (allErrors.length > 0) {
        setErrors(allErrors);
      } else {
        queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
        queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
        setImportResult({ success: true, count: totalCreated });
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setErrors([
        {
          row: 0,
          message: `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setIsImporting(false);
    }
  }, [allRiddles, subjectNameToId, queryClient, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    setFile(null);
    setPreview([]);
    setAllRiddles([]);
    setErrors([]);
    setProgress(0);
    setImportResult(null);
    onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Import Riddles from CSV</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {!importResult ? (
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
                  #,question,optionA,optionB,optionC,optionD,answer,level,subject,hint,explanation,status
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Use <strong># Category:</strong> metadata lines to group riddles. Answer format:{' '}
                  <strong>B. Option text</strong> for normal levels, or just text for expert level.
                </p>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">
                    Preview ({preview.length} of {allRiddles.length} riddles)
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded border bg-gray-50 divide-y">
                    {preview.map((r, i) => (
                      <div key={i} className="p-3 text-sm">
                        <p className="font-medium text-gray-900 line-clamp-1">{r.question}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Level: {r.level} | Subject: {r.subjectName || '(none)'} | Options:{' '}
                          {r.options.length}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <div className="rounded-lg bg-red-50 p-3 space-y-1">
                  <p className="text-sm font-medium text-red-600">{errors.length} error(s) found</p>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-500 space-y-1">
                    {errors.slice(0, 10).map((err, i) => (
                      <p key={i}>
                        {err.row > 0 ? `Row ${err.row}: ` : ''}
                        {err.message}
                      </p>
                    ))}
                    {errors.length > 10 && <p>...and {errors.length - 10} more</p>}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-lg font-medium text-gray-900">Import Successful!</p>
              <p className="text-gray-500 mt-1">{importResult.count} riddles imported</p>
            </div>
          )}
        </div>

        {!importResult && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={allRiddles.length === 0 || isImporting || errors.length > 0}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Importing... {Math.round(progress)}%
                </>
              ) : (
                `Import ${allRiddles.length} Riddles`
              )}
            </button>
          </div>
        )}

        {isImporting && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportModal;
