/**
 * ============================================================================
 * Admin Utilities
 * ============================================================================
 * Shared utility functions for the admin module
 * ============================================================================
 */

import type { ContentStatus, Joke, Riddle, Question, ImportResult, ImportExportConfig, ValidationResult } from '../types';

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
      id: String(Date.now()),
      setup: values[1]?.replace(/""/g, '"').replace(/^"|"$/g, '') || '',
      punchline: values[2]?.replace(/""/g, '"').replace(/^"|"$/g, '') || '',
      category: values[3] || 'General',
      status: 'published',
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
// QUESTION IMPORT/EXPORT CONFIGURATION
// ============================================================================

/** Question Import/Export Config */
export const questionConfig: ImportExportConfig<Question> = {
  entityName: 'Question',
  filePrefix: 'questions',
  // Full headers used for exporting. Import validation only requires the minimal set below.
  csvHeaders: ['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Level', 'Chapter'],
  jsonRootKey: 'questions',
  validators: {
    // Only these four are truly required for a valid import row.
    // Option A-D are OPTIONAL — handled gracefully in handleConfirmImport.
    required: ['question', 'correctAnswer', 'level', 'chapter'],
    enumFields: {
      level: ['easy', 'medium', 'hard', 'expert', 'extreme'],
      correctAnswer: ['A', 'B', 'C', 'D'],
    },
    maxLength: { question: 1000, chapter: 200 },
  },
};

/**
 * Parse Question CSV in animals-questions.csv format
 * Handles: comment lines (# Subject: xxx), empty option fields, quoted values
 */
/**
 * Parse Question CSV using standardized importer
 */
export function parseQuestionCSV(csvText: string): ImportResult<Question> {
  return importFromCSV(csvText, questionConfig, (values, headers) => {
    // Standardize header matching
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/\s+/g, ''));

    console.log('=== CSV PARSE DEBUG ===');
    console.log('Headers:', headers);
    console.log('Normalized:', normalizedHeaders);
    console.log('First row values:', values);

    const getValue = (...headerNames: string[]): string => {
      for (const name of headerNames) {
        const normalizedName = name.toLowerCase().replace(/\s+/g, '');
        const idx = normalizedHeaders.findIndex(h => h.includes(normalizedName));
        console.log(`Looking for '${name}' (${normalizedName}) -> found at index ${idx}`);
        if (idx !== -1 && idx < values.length) {
          const val = values[idx] ?? '';
          return val.trim();
        }
      }
      return '';
    };

    const result = {
      id: String(Date.now() + Math.random()),
      question: getValue('question'),
      optionA: getValue('optiona', 'option1', 'answera', 'answer1', 'choicea', 'choice1'),
      optionB: getValue('optionb', 'option2', 'answerb', 'answer2', 'choiceb', 'choice2'),
      optionC: getValue('optionc', 'option3', 'answerc', 'answer3', 'choicec', 'choice3'),
      optionD: getValue('optiond', 'option4', 'answerd', 'answer4', 'choiced', 'choice4'),
      correctAnswer: getValue('correctanswer', 'correct', 'answer') || 'A',
      level: (getValue('level', 'difficulty') || 'easy').toLowerCase() as Question['level'],
      chapter: getValue('chapter', 'topic', 'category') || 'General',
      status: 'published' as const,
    };

    console.log('Parsed result:', result);
    console.log('======================');

    return result;
  });
}

/**
 * Export questions to CSV format matching animals-questions.csv
 */
/**
 * Export questions to CSV format
 */
export function exportQuestionsToCSV(questions: Question[], subjectName: string = 'General'): string {
  return exportToCSV(questions, questionConfig, { subject: subjectName });
}

/**
 * Export questions to JSON format
 */
export function exportQuestionsToJSON(questions: Question[], subjectName: string = 'General'): string {
  return exportToJSON(questions, questionConfig, { subject: subjectName });
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
  csvHeaders: ['ID', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Level', 'Chapter'],
  jsonRootKey: 'riddles',
  validators: {
    required: ['question', 'options', 'correctOption', 'difficulty', 'chapter'],
    enumFields: {
      difficulty: ['easy', 'medium', 'hard', 'expert'],
      correctOption: ['A', 'B', 'C', 'D'],
    },
    maxLength: { question: 1000, answer: 500, chapter: 200, hint: 500 },
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
 * Headers: ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
 */
export function riddlesToCSV(riddles: Riddle[]): string {
  const lines: string[] = [];

  // Add count comment
  lines.push(`# Count: ${riddles.length}`);

  // Add headers matching quiz format
  lines.push('ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter');

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
      escapeCSV(riddle.chapter),
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
