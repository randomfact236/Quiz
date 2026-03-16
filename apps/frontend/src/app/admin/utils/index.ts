/**
 * ============================================================================
 * Admin Utilities
 * ============================================================================
 * Shared utility functions for the admin module
 * ============================================================================
 */

import type { ContentStatus, Joke, Riddle, ImportResult, ImportExportConfig, ValidationResult } from '../types';

/**
 * Get status badge color class
 */
export function getStatusBadgeColor(status: ContentStatus): string {
  switch (status) {
    case 'published': return 'bg-green-100 text-green-800';
    case 'draft': return 'bg-yellow-100 text-yellow-800';
    case 'trash': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get difficulty badge color class
 */
export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-orange-100 text-orange-800';
    case 'expert': return 'bg-red-100 text-red-800';
    case 'extreme': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Filter jokes hook helper
 */
export function useJokeFilters(
  allJokes: Joke[],
  filterCategory: string,
  search: string,
  statusFilter: string
): { filteredJokes: Joke[]; statusCounts: { total: number; published: number; draft: number; trash: number } } {
  const filteredJokes = allJokes.filter(joke => {
    const matchesCategory = !filterCategory || joke.category === filterCategory;
    const searchText = search.toLowerCase();
    const jokeContent = (joke.setup || '') + ' ' + (joke.punchline || '') + ' ' + (joke.joke || '');
    const matchesSearch = !search || jokeContent.toLowerCase().includes(searchText);
    const matchesStatus = statusFilter === 'all' || joke.status === statusFilter;
    return matchesCategory && matchesSearch && matchesStatus;
  });

  const statusCounts = {
    total: allJokes.length,
    published: allJokes.filter(j => j.status === 'published').length,
    draft: allJokes.filter(j => j.status === 'draft').length,
    trash: allJokes.filter(j => j.status === 'trash').length,
  };

  return { filteredJokes, statusCounts };
}

/**
 * Convert jokes to CSV format
 */
export function jokesToCSV(jokes: Joke[]): string {
  const headers = ['ID', 'Setup', 'Punchline', 'Category', 'Status'];
  const rows = jokes.map(j => [
    j.id,
    `"${(j.setup || '').replace(/"/g, '""')}"`,
    `"${(j.punchline || '').replace(/"/g, '""')}"`,
    j.category,
    j.status,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Convert jokes to JSON format
 */
export function jokesToJSON(jokes: Joke[]): string {
  return JSON.stringify({ jokes, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Parse joke CSV
 */
export function parseJokeCSV(csvText: string): ImportResult<Joke> {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    return { success: false, imported: [], failed: [], total: 0 };
  }

  const imported: Joke[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = parseCSVLine(line);
    // Flexible parsing: ID, Setup/Joke, Punchline, Category, Status
    if (values.length < 3) {
      failed.push({ row: i, error: 'Invalid format', data: line });
      continue;
    }

    imported.push({
      id: String(parseInt(values[0] || '0') || Date.now() + i),
      setup: values[1]?.replace(/""/g, '"').replace(/^"|"$/g, '') || '',
      punchline: values[2]?.replace(/""/g, '"').replace(/^"|"$/g, '') || '',
      category: values[3] || 'General',
      status: 'draft',
    });
  }

  return { success: failed.length === 0, imported, failed, total: lines.length - 1 };
}

/**
 * Parse CSV line (handles quoted values and empty fields)
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// ============================================================================
// QUESTION IMPORT/EXPORT CONFIGURATION (Matches animals-questions.csv format)
// ============================================================================

import type { Question } from '../types';

/** Question CSV Config for format: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter */
export const questionCSVConfig = {
  headers: ['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Level', 'Chapter'],
};

/**
 * Parse Question CSV in animals-questions.csv format
 * Handles: comment lines (# Subject: xxx), empty option fields, quoted values
 */
export function parseQuestionCSV(csvText: string): { success: boolean; imported: Question[]; failed: { row: number; error: string; data: unknown }[]; total: number; subjectName: string } {
  const imported: Question[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];

  const lines = csvText.trim().split('\n');

  // Skip comment lines (starting with #) and find header
  let headerIndex = 0;
  let subjectName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (line.startsWith('#')) {
      // Extract subject name from comment like "# Subject: Animals"
      // Also strip trailing commas that might exist in some CSV formats (e.g., "# Subject: Animals,,,,,,,")
      const match = line.match(/#\s*Subject:\s*(.+)/i);
      if (match?.[1]) {
        subjectName = match[1].replace(/,+$/, '').trim();
      }
      headerIndex = i + 1;
    } else if (line.includes('Question') && line.includes('Option')) {
      headerIndex = i;
      break;
    }
  }

  const headerLine = lines[headerIndex];
  if (headerIndex >= lines.length || !headerLine) {
    return { success: false, imported: [], failed: [{ row: 0, error: 'No valid header found', data: null }], total: 0, subjectName: '' };
  }

  // Parse headers
  const headers = parseCSVLine(headerLine);

  // Find column indices (flexible matching)
  const getColumnIndex = (...names: string[]) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colIndex = {
    id: getColumnIndex('id'),
    question: getColumnIndex('question'),
    optionA: getColumnIndex('option a'),
    optionB: getColumnIndex('option b'),
    optionC: getColumnIndex('option c'),
    optionD: getColumnIndex('option d'),
    correctAnswer: getColumnIndex('correct answer'),
    level: getColumnIndex('level'),
    chapter: getColumnIndex('chapter'),
  };

  // Validate required columns
  const requiredCols = ['question', 'optionA', 'optionB', 'correctAnswer', 'level'];
  const missingCols = requiredCols.filter(col => colIndex[col as keyof typeof colIndex] === -1);

  if (missingCols.length > 0) {
    return {
      success: false,
      imported: [],
      failed: [{ row: 0, error: `Missing required columns: ${missingCols.join(', ')}`, data: headers }],
      total: 0,
      subjectName: ''
    };
  }

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);

    try {
      const getValue = (idx: number) => idx !== -1 && idx < values.length ? (values[idx]?.trim() ?? '') : '';

      const questionText = getValue(colIndex.question);
      const optionA = getValue(colIndex.optionA);
      const optionB = getValue(colIndex.optionB);
      const optionC = colIndex.optionC !== -1 ? getValue(colIndex.optionC) : '';
      const optionD = colIndex.optionD !== -1 ? getValue(colIndex.optionD) : '';
      const correctAnswer = getValue(colIndex.correctAnswer) || 'A';
      const level = (getValue(colIndex.level) || 'easy').toLowerCase() as Question['level'];
      const chapter = getValue(colIndex.chapter) || subjectName || 'General';

      // Validate
      if (!questionText) {
        failed.push({ row: i, error: 'Missing question text', data: line });
        continue;
      }

      if (!optionA || !optionB) {
        failed.push({ row: i, error: 'Missing required options (A and B)', data: line });
        continue;
      }

      // Map correct answer letter to option text
      imported.push({
        id: String(Date.now() + i),
        question: questionText,
        optionA,
        optionB,
        optionC: optionC || '',
        optionD: optionD || '',
        correctAnswer: correctAnswer.toUpperCase(),
        correctLetter: correctAnswer.toUpperCase(),
        level,
        chapter,
        status: 'published',
      });
    } catch (err) {
      failed.push({ row: i, error: (err as Error).message, data: line });
    }
  }

  return {
    success: failed.length === 0,
    imported,
    failed,
    total: imported.length + failed.length,
    subjectName,
  };
}

/**
 * Parse animals_questions.csv format
 * Handles TRUE/FALSE questions and regular multiple choice
 * Format: # Subject: Animals
 * Headers: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
 */
export function parseAnimalsQuestionCSV(csvText: string): {
  success: boolean;
  imported: Question[];
  failed: { row: number; error: string; data: unknown }[];
  total: number;
  subjectName: string;
  chapters: string[];
} {
  const imported: Question[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];
  const chaptersSet = new Set<string>();

  const lines = csvText.trim().split('\n');
  let headerIndex = 0;
  let subjectName = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (line.startsWith('#')) {
      const match = line.match(/#\s*Subject:\s*(.+)/i);
      if (match?.[1]) {
        subjectName = match[1].trim();
      }
    } else if (line.includes('Question') && line.includes('Option')) {
      headerIndex = i;
      break;
    }
  }

  const headerLine = lines[headerIndex];
  if (!headerLine) {
    return { success: false, imported: [], failed: [{ row: 0, error: 'No valid header found', data: null }], total: 0, subjectName: '', chapters: [] };
  }

  const headers = parseCSVLine(headerLine);

  const getColumnIndex = (...names: string[]) => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().trim() === name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const colIndex = {
    id: getColumnIndex('id'),
    question: getColumnIndex('question'),
    optionA: getColumnIndex('option a'),
    optionB: getColumnIndex('option b'),
    optionC: getColumnIndex('option c'),
    optionD: getColumnIndex('option d'),
    correctAnswer: getColumnIndex('correct answer'),
    level: getColumnIndex('level'),
    chapter: getColumnIndex('chapter'),
  };

  if (colIndex.question === -1 || colIndex.optionA === -1 || colIndex.optionB === -1) {
    return {
      success: false,
      imported: [],
      failed: [{ row: 0, error: 'Missing required columns (Question, Option A, Option B)', data: headers }],
      total: 0,
      subjectName: '',
      chapters: []
    };
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line) continue;

    const values = parseCSVLine(line);

    try {
      const getValue = (idx: number) => idx !== -1 && idx < values.length ? (values[idx]?.trim() ?? '') : '';

      const questionText = getValue(colIndex.question);
      let optionA = getValue(colIndex.optionA);
      let optionB = getValue(colIndex.optionB);
      const optionC = colIndex.optionC !== -1 ? getValue(colIndex.optionC) : '';
      const optionD = colIndex.optionD !== -1 ? getValue(colIndex.optionD) : '';
      const correctAnswerRaw = (getValue(colIndex.correctAnswer) || 'A').toUpperCase();
      const level = (getValue(colIndex.level) || 'easy').toLowerCase() as Question['level'];
      const chapter = getValue(colIndex.chapter) || 'General';

      if (!questionText) {
        failed.push({ row: i, error: 'Missing question text', data: line });
        continue;
      }

      let correctAnswer = correctAnswerRaw;
      let finalOptionA = optionA;
      let finalOptionB = optionB;
      let finalOptionC = optionC;
      let finalOptionD = optionD;

      const isTrueFalseQuestion = (val: string) => {
        const v = val.toUpperCase();
        return v === 'TRUE' || v === 'FALSE' || v === 'T' || v === 'F';
      };

      if (isTrueFalseQuestion(optionA) && isTrueFalseQuestion(optionB)) {
        finalOptionA = 'True';
        finalOptionB = 'False';

        if (correctAnswerRaw === 'A' || correctAnswerRaw.toUpperCase() === 'TRUE' || correctAnswerRaw.toUpperCase() === 'T') {
          correctAnswer = 'A';
        } else {
          correctAnswer = 'B';
        }
      }

      if (!finalOptionA && !finalOptionB) {
        failed.push({ row: i, error: 'Missing required options (A and B)', data: line });
        continue;
      }

      chaptersSet.add(chapter);

      imported.push({
        id: String(Date.now() + i),
        question: questionText,
        optionA: finalOptionA,
        optionB: finalOptionB,
        optionC: finalOptionC || '',
        optionD: finalOptionD || '',
        correctAnswer,
        correctLetter: correctAnswer,
        level,
        chapter,
        status: 'published',
      });
    } catch (err) {
      failed.push({ row: i, error: (err as Error).message, data: line });
    }
  }

  return {
    success: failed.length === 0,
    imported,
    failed,
    total: imported.length + failed.length,
    subjectName,
    chapters: Array.from(chaptersSet),
  };
}

/**
 * Export questions to CSV format matching animals-questions.csv
 */
export function exportQuestionsToCSV(questions: Question[], subjectName: string = 'General'): string {
  const lines: string[] = [];

  // Add subject comment
  lines.push(`# Subject: ${subjectName}`);

  // Add headers
  lines.push('ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter');

  // Add data rows
  questions.forEach((q, idx) => {
    const escapeCSV = (value: string) => {
      if (!value) return '';
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const row = [
      idx + 1,
      escapeCSV(q.question),
      escapeCSV(q.optionA),
      escapeCSV(q.optionB),
      escapeCSV(q.optionC || ''),
      escapeCSV(q.optionD || ''),
      q.correctAnswer || 'A',
      q.level,
      escapeCSV(q.chapter),
    ];

    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Download file helper
 */
export function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// RIDDLE IMPORT/EXPORT CONFIGURATION
// ============================================================================

/** Riddle Import/Export Config */
export const riddleConfig: ImportExportConfig<Riddle> = {
  entityName: 'Riddle',
  filePrefix: 'riddles',
  csvHeaders: ['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Level'],
  jsonRootKey: 'riddles',
  validators: {
    required: ['question', 'options', 'correctOption', 'difficulty'],
    enumFields: {
      difficulty: ['easy', 'medium', 'hard', 'expert'],
      correctOption: ['A', 'B', 'C', 'D'],
      correctLetter: ['A', 'B', 'C', 'D'],
    },
    maxLength: { question: 1000, answer: 500, hint: 500 },
  },
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Enterprise-Grade JSON Validator
 * Validates JSON content structure
 */
export function validateJSONStructure<T>(jsonText: string, rootKey?: string): ValidationResult<T[]> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = JSON.parse(jsonText);

    let dataArray: T[];
    if (rootKey && parsed[rootKey]) {
      dataArray = Array.isArray(parsed[rootKey]) ? parsed[rootKey] : [parsed[rootKey]];
    } else if (Array.isArray(parsed)) {
      dataArray = parsed;
    } else {
      dataArray = [parsed];
    }

    if (dataArray.length === 0) {
      errors.push('No data records found in JSON file');
    }

    return {
      isValid: errors.length === 0,
      data: dataArray,
      errors,
      warnings
    };
  } catch (err) {
    errors.push(`Invalid JSON format: ${(err as Error).message}`);
    return { isValid: false, data: null, errors, warnings };
  }
}

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Enterprise-Grade Generic CSV Exporter
 */
export function exportToCSV<T>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, string>
): string {
  const headers = config.csvHeaders;

  const rows = items.map(item =>
    headers.map(header => {
      const key = header.toLowerCase().replace(/\s+/g, '') as keyof T;
      const value = item[key];

      if (value === null || value === undefined) { return ''; }

      const strValue = String(value);
      // Escape quotes and wrap in quotes if contains comma or newline
      if (strValue.includes(',') || strValue.includes('\n') || strValue.includes('"')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      return strValue;
    })
  );

  // Add metadata header if provided
  let csvContent = '';
  if (metadata) {
    csvContent += '# ' + Object.entries(metadata).map(([k, v]) => `${k}: ${v}`).join(' | ') + '\n';
  }

  csvContent += [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  return csvContent;
}

/**
 * Enterprise-Grade Generic JSON Exporter
 */
export function exportToJSON<T>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, unknown>
): string {
  const data: Record<string, unknown> = {
    [config.jsonRootKey]: items,
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };

  if (metadata) {
    data['metadata'] = metadata;
  }

  return JSON.stringify(data, null, 2);
}

/**
 * Enterprise-Grade Generic CSV Importer
 */
export function importFromCSV<T>(
  csvText: string,
  config: ImportExportConfig<T>,
  mapper: (values: string[], headers: string[]) => Partial<T>
): ImportResult<T> {
  const imported: T[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];

  const validationResult = validateCSVStructure(csvText, config.csvHeaders);
  if (!validationResult.isValid || !validationResult.data) {
    return {
      success: false,
      imported,
      failed: validationResult.errors.map((err, idx) => ({
        row: idx,
        error: err,
        data: null
      })),
      total: 0
    };
  }

  const lines = validationResult.data;
  const firstLine = lines[0];
  if (!firstLine) {
    return { success: false, imported, failed, total: 0 };
  }

  const headers = parseCSVLine(firstLine);

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') { continue; }

    const values = parseCSVLine(line);
    try {
      const partialData = mapper(values, headers);

      // Simple validation - check required fields
      const missingFields = config.validators.required.filter(field => {
        const value = partialData[field];
        return value === undefined || value === null || value === '';
      });

      if (missingFields.length === 0) {
        imported.push(partialData as T);
      } else {
        failed.push({ row: i, error: `Missing fields: ${missingFields.join(', ')}`, data: partialData });
      }
    } catch (err) {
      failed.push({ row: i, error: (err as Error).message, data: line });
    }
  }

  return {
    success: failed.length === 0,
    imported,
    failed,
    total: imported.length + failed.length
  };
}

/**
 * Validate CSV structure
 */
function validateCSVStructure(
  csvText: string,
  expectedHeaders?: string[]
): { isValid: boolean; data: string[] | null; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.trim().split('\n');

  if (lines.length === 0) {
    errors.push('CSV file is empty');
    return { isValid: false, data: null, errors };
  }

  // Skip comment lines to find the actual header row
  const firstDataLineIndex = lines.findIndex(line => line.trim() !== '' && !line.trim().startsWith('#'));

  if (firstDataLineIndex === -1) {
    errors.push('CSV file has no header row or data');
    return { isValid: false, data: null, errors };
  }

  const validLines = lines.slice(firstDataLineIndex);

  if (expectedHeaders && expectedHeaders.length > 0) {
    const firstLine = validLines[0];
    if (!firstLine) {
      errors.push('CSV file has no header row');
      return { isValid: false, data: null, errors };
    }
    const headers = parseCSVLine(firstLine);
    const missingHeaders = expectedHeaders.filter(h =>
      !headers.some(header => header.toLowerCase().includes(h.toLowerCase()))
    );
    if (missingHeaders.length > 0) {
      errors.push(`Missing expected headers: ${missingHeaders.join(', ')}`);
    }
  }

  return { isValid: errors.length === 0, data: validLines, errors };
}

// ============================================================================
// RIDDLE SPECIFIC FUNCTIONS
// ============================================================================

/**
 * Convert riddles to CSV format matching quiz export format
 * Headers: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level
 */
export function riddlesToCSV(riddles: Riddle[]): string {
  const lines: string[] = [];

  // Add count comment
  lines.push(`# Count: ${riddles.length}`);

  // Add headers matching quiz format
  lines.push('ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level');

  // Add data rows
  riddles.forEach(riddle => {
    const options = riddle.options || [];

    const row = [
      riddle.id,
      escapeCSV(riddle.question),
      escapeCSV(options[0] || ''),
      escapeCSV(options[1] || ''),
      escapeCSV(options[2] || ''),
      escapeCSV(options[3] || ''),
      riddle.correctOption || 'A',
      riddle.difficulty,
    ];

    lines.push(row.join(','));
  });

  return lines.join('\n');
}

/**
 * Escape CSV value - handles commas, newlines, and quotes
 */
function escapeCSV(value: string | number): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If contains comma, newline, or quote, wrap in quotes and escape inner quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert riddles to JSON format
 */
export function riddlesToJSON(riddles: Riddle[]): string {
  return exportToJSON(riddles, riddleConfig, { count: riddles.length });
}

/**
 * Parse riddle CSV
 */
export function parseRiddleCSV(csvText: string): ImportResult<Riddle> {
  return importFromCSV(csvText, riddleConfig, (values, headers) => {
    const getValue = (_index: number, ...headerNames: string[]): string => {
      // Ignore spaces for matching headers like "Option A" to "optiona"
      const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, ''));
      for (const headerName of headerNames) {
        const normalizedHeaderName = headerName.toLowerCase().replace(/\s+/g, '');
        const headerIndex = normalizedHeaders.findIndex(h => h.includes(normalizedHeaderName));
        if (headerIndex !== -1 && headerIndex < values.length) {
          return values[headerIndex] ?? '';
        }
      }
      return '';
    };

    const optA = getValue(2, 'optiona', 'answer');
    const optB = getValue(3, 'optionb');
    const optC = getValue(4, 'optionc');
    const optD = getValue(5, 'optiond');

    const options: string[] = [];
    if (optA) options.push(optA);
    if (optB) options.push(optB);
    if (optC) options.push(optC);
    if (optD) options.push(optD);

    const finalOptions = options.length >= 2 ? options : ['Option A', 'Option B', 'Option C', 'Option D'];

    return {
      id: String(Date.now() + Math.floor(Math.random() * 1000)),
      question: getValue(1, 'question'),
      answer: getValue(2, 'answer', 'optiona'), // Provide a fallback if needed
      options: finalOptions,
      correctOption: getValue(6, 'correctanswer', 'correctoption') || 'A',
      difficulty: (getValue(7, 'level', 'difficulty') || 'medium') as Riddle['difficulty'],
      chapter: getValue(8, 'chapter') || 'General',
      hint: getValue(10, 'hint'),
      status: 'published' as const,
    };
  });
}
