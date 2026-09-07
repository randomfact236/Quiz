'use client';

import { useState, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X, Upload, FileText, Download } from 'lucide-react';
import { bulkCreateRiddles } from '@/lib/riddle-mcq-api';
import type { CreateRiddleMcqDto, BulkImportDuplicate } from '@/lib/riddle-mcq-api';
import { parseCsvContent, type ParsedRiddle, type ImportError } from './csv-parser';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Called once after a fully successful import, with the number of riddles created. */
  onSuccess?: (importedCount: number) => void;
}

interface ImportResult {
  success: boolean;
  count?: number;
  errors?: ImportError[];
}

/** Duplicate rows the server skipped, with the offending question highlighted. */
function DuplicatesPanel({ duplicates }: { duplicates: BulkImportDuplicate[] }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-900/20 p-3 space-y-1.5">
      <p className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {duplicates.length} duplicate question{duplicates.length === 1 ? '' : 's'} skipped — already
        exist{duplicates.length === 1 ? 's' : ''} in this subject
      </p>
      <div className="max-h-32 overflow-y-auto space-y-1">
        {duplicates.map((d) => (
          <p key={d.row} className="text-xs text-amber-900 dark:text-amber-100">
            <span className="font-semibold">Row {d.row}</span>
            {d.duplicateOfRow !== undefined ? ` (duplicate of Row ${d.duplicateOfRow}):` : ':'}
            <mark className="ml-1 rounded bg-amber-100 px-1 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-300 dark:bg-amber-900/40 dark:text-amber-100 dark:ring-amber-700">
              {d.question}
            </mark>
          </p>
        ))}
      </div>
    </div>
  );
}

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

export function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRiddle[]>([]);
  const [allRiddles, setAllRiddles] = useState<ParsedRiddle[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [duplicates, setDuplicates] = useState<BulkImportDuplicate[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (!selectedFile) return;

      setFile(selectedFile);
      setErrors([]);
      setDuplicates([]);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const { riddles: parsed } = parseCsvContent(content);
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
    setDuplicates([]);
    setProgress(0);

    const CHUNK_SIZE = 100;
    const riddlesWithSubjectId: CreateRiddleMcqDto[] = [];
    const validationErrors: ImportError[] = [];

    for (let i = 0; i < allRiddles.length; i++) {
      const r = allRiddles[i]!;

      if (!r.subjectName) {
        validationErrors.push({ row: i + 2, message: 'Subject name is required' });
        continue;
      }

      const dto: CreateRiddleMcqDto = {
        question: r.question,
        options: r.options.length > 0 ? r.options : [],
        level: r.level as CreateRiddleMcqDto['level'],
        subjectName: r.subjectName,
        status: (r.status as CreateRiddleMcqDto['status']) || 'draft',
        importOrder: i + 1,
      };

      if (r.categoryName) {
        dto.categoryName = r.categoryName;
      }

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
    const allDuplicates: BulkImportDuplicate[] = [];
    let totalCreated = 0;

    try {
      for (let i = 0; i < riddlesWithSubjectId.length; i += CHUNK_SIZE) {
        const chunk = riddlesWithSubjectId.slice(i, i + CHUNK_SIZE);
        const result = await bulkCreateRiddles(chunk);

        // Server error strings already carry their row number ("Row N: ...").
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach((err) => {
            allErrors.push({ row: 0, message: err });
          });
        }
        if (result.duplicates && result.duplicates.length > 0) {
          allDuplicates.push(...result.duplicates);
        }
        totalCreated += result.count;
        setProgress(Math.min(((i + CHUNK_SIZE) / riddlesWithSubjectId.length) * 100, 100));
      }

      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-questions'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-filter-counts'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-categories'] });
      queryClient.invalidateQueries({ queryKey: ['riddle-mcq-subjects'] });

      setDuplicates(allDuplicates);

      if (totalCreated > 0) {
        setErrors(allErrors);
        setImportResult({ success: true, count: totalCreated });
        // Give the user time to see the duplicates panel before auto-closing.
        const delay = allDuplicates.length > 0 || allErrors.length > 0 ? 5000 : 1500;
        setTimeout(() => {
          onSuccess?.(totalCreated);
          onClose();
        }, delay);
      } else {
        setErrors(
          allErrors.length > 0 ? allErrors : [{ row: 0, message: 'No riddles were imported' }]
        );
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
  }, [allRiddles, queryClient, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    setFile(null);
    setPreview([]);
    setAllRiddles([]);
    setErrors([]);
    setDuplicates([]);
    setProgress(0);
    setImportResult(null);
    onClose();
  }, [onClose]);

  const otherErrors = errors.filter((e) => !e.message.includes('Duplicate question'));

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ position: 'fixed' }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-secondary-50">
            Import Riddles from CSV
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-secondary-800 rounded-lg"
          >
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
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' : 'border-gray-300 dark:border-secondary-600 hover:border-gray-400'}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-300">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">{file.name}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto text-gray-400 dark:text-secondary-400 mb-3" />
                    <p className="text-gray-600 dark:text-secondary-300">
                      Drag and drop a CSV file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 dark:text-secondary-400 mt-2">
                      Only .csv files are supported
                    </p>
                  </>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-secondary-800 rounded-lg p-4 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-700 dark:text-secondary-200">CSV Format:</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadTemplate();
                    }}
                    className="flex items-center gap-1 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Download Template
                  </button>
                </div>
                <code className="text-xs text-gray-600 dark:text-secondary-300 block overflow-x-auto whitespace-nowrap">
                  #,question,optionA,optionB,optionC,optionD,answer,level,subject,hint,explanation,status
                </code>
                <p className="text-xs text-gray-500 dark:text-secondary-400 mt-2">
                  Use <strong># Category:</strong> metadata lines to group riddles. Answer format:{' '}
                  <strong>B. Option text</strong> for normal levels, or just text for expert level.
                </p>
              </div>

              {preview.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-secondary-200">
                    Preview ({preview.length} of {allRiddles.length} riddles)
                  </h3>
                  <div className="max-h-48 overflow-y-auto rounded border bg-gray-50 dark:bg-secondary-800 divide-y">
                    {preview.map((r, i) => (
                      <div key={i} className="p-3 text-sm">
                        <p className="font-medium text-gray-900 dark:text-secondary-50 line-clamp-1">
                          {r.question}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-secondary-400 mt-1">
                          Level: {r.level} | Subject: {r.subjectName || '(none)'} | Options:{' '}
                          {r.options.length}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {duplicates.length > 0 && <DuplicatesPanel duplicates={duplicates} />}

              {errors.length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 p-3 space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-300">
                    {errors.length} error(s) found
                  </p>
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
              <p className="text-lg font-medium text-gray-900 dark:text-secondary-50">
                Import Successful!
              </p>
              <p className="text-gray-500 dark:text-secondary-400 mt-1">
                {importResult.count} riddles imported
                {duplicates.length > 0 ? ` · ${duplicates.length} duplicates skipped` : ''}
              </p>
              {duplicates.length > 0 && (
                <div className="mt-4 text-left">
                  <DuplicatesPanel duplicates={duplicates} />
                </div>
              )}
              {otherErrors.length > 0 && (
                <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 text-left">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">
                    {otherErrors.length} row{otherErrors.length === 1 ? '' : 's'} failed
                  </p>
                  <div className="max-h-32 overflow-y-auto text-xs text-red-500 space-y-1 mt-1">
                    {otherErrors.slice(0, 10).map((err, i) => (
                      <p key={i}>{err.message}</p>
                    ))}
                    {otherErrors.length > 10 && <p>...and {otherErrors.length - 10} more</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!importResult && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-secondary-700 bg-white dark:bg-secondary-800 flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-secondary-200 bg-gray-100 dark:bg-secondary-800 hover:bg-gray-200 dark:hover:bg-secondary-700 rounded-lg"
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
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-secondary-700">
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
