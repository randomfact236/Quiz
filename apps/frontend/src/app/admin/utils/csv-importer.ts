/**
 * ============================================================================
 * CSV Quiz Importer
 * ============================================================================
 * Single source of truth for CSV import logic.
 *
 * Supported CSV format:
 *   # Subject: <Subject Name>
 *   ID,Question,Option A,Option B,Option C,Option D,Correct Answer,Level,Chapter
 *
 * Level rules:
 *   easy    → True/False (Option A = FALSE, Option B = TRUE, or vice-versa)
 *   medium  → 2 options (A, B)
 *   hard    → 3 options (A, B, C)
 *   expert  → 4 options (A, B, C, D)
 *   extreme → Open answer — no options. "Correct Answer" column holds the answer text.
 * ============================================================================
 */

import {
  getSubjectBySlug,
  createSubject,
  getChaptersBySubject,
  createChapter,
  createQuestionsBulk,
} from '@/lib/quiz-api';
import type { Subject } from '@/app/admin/types';

// ─── Public Result Types ─────────────────────────────────────────────────────

export interface CSVImportResult {
  success: boolean;
  subjectName: string;
  subjectSlug: string;
  questionsImported: number;
  chaptersCreated: number;
  errors: string[];
  warnings: string[];
}

export interface CSVParseRow {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswerRaw: string; // The raw value from "Correct Answer" column (letter OR open text)
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
  chapter: string;
}

// ─── Internal helpers ────────────────────────────────────────────────────────

const VALID_LEVELS = ['easy', 'medium', 'hard', 'expert', 'extreme'] as const;

/**
 * Parse a single CSV line, respecting double-quoted fields that may contain commas.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
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

/**
 * Extract subject name from lines like "# Subject: Animals,,,,"
 */
function extractSubjectName(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/#\s*Subject:\s*(.+)/i);
      if (match?.[1]) {
        // Strip trailing commas (e.g. from Excel export padding)
        return match[1].replace(/,+$/, '').trim();
      }
    }
  }
  return '';
}

/**
 * Build URL-safe slug from a display name.
 */
function generateSlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'subject';
}

/**
 * Returns true if the value is a recognized True/False token.
 */
function isTFToken(val: string): boolean {
  const v = val.toUpperCase();
  return v === 'TRUE' || v === 'FALSE' || v === 'T' || v === 'F';
}

/**
 * Normalize a True/False token to the canonical "True" or "False" display text.
 */
function normalizeTFToken(val: string): 'True' | 'False' {
  const v = val.toUpperCase();
  return v === 'TRUE' || v === 'T' ? 'True' : 'False';
}

// ─── Step 1 – Pure CSV parsing (no API calls) ────────────────────────────────

interface ParsedCSV {
  subjectName: string;
  rows: CSVParseRow[];
  errors: string[];
  warnings: string[];
}

export function parseCSVContent(csvContent: string): ParsedCSV {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: CSVParseRow[] = [];
  const lines = csvContent.trim().split('\n');

  const subjectName = extractSubjectName(lines);
  if (!subjectName) {
    errors.push('No subject found. Make sure the CSV starts with: # Subject: <Name>');
    return { subjectName: '', rows, errors, warnings };
  }

  // Find the header row
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? '').trim();
    if (line && !line.startsWith('#') && line.toLowerCase().includes('question') && line.toLowerCase().includes('option')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    errors.push('Header row not found. Expected a row containing "Question" and "Option".');
    return { subjectName, rows, errors, warnings };
  }

  const headers = parseCSVLine(lines[headerIndex]!);
  console.log(`[DEBUG CSV] Detected headers:`, headers);

  // Locate columns (flexible matching)
  const findCol = (...names: string[]): number => {
    for (const name of names) {
      const idx = headers.findIndex(h => h.toLowerCase().replace(/\s+/g, ' ').trim() === name.toLowerCase());
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const col = {
    question: findCol('question'),
    optionA: findCol('option a', 'optiona', 'option_a'),
    optionB: findCol('option b', 'optionb', 'option_b'),
    optionC: findCol('option c', 'optionc', 'option_c'),
    optionD: findCol('option d', 'optiond', 'option_d'),
    correctAnswer: findCol('correct answer', 'correctanswer', 'correct_answer', 'answer'),
    level: findCol('level', 'difficulty'),
    chapter: findCol('chapter', 'category', 'topic'),
  };
  console.log(`[DEBUG CSV] Column indices:`, col);

  // Required columns
  const missing: string[] = [];
  if (col.question === -1) missing.push('Question');
  if (col.correctAnswer === -1) missing.push('Correct Answer');
  if (col.level === -1) missing.push('Level');
  if (missing.length) {
    errors.push(`Missing required columns: ${missing.join(', ')}`);
    return { subjectName, rows, errors, warnings };
  }

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const values = parseCSVLine(line);

    const get = (idx: number): string =>
      idx !== -1 && idx < values.length ? (values[idx] ?? '').trim() : '';

    const questionText = get(col.question);
    if (!questionText) continue; // Skip blank rows

    const levelRaw = get(col.level);
    const levelLower = (levelRaw || 'easy').toLowerCase();
    console.log(`[DEBUG CSV] Row ${i + 1}: levelRaw="${levelRaw}", levelLower="${levelLower}"`);
    if (!VALID_LEVELS.includes(levelLower as typeof VALID_LEVELS[number])) {
      warnings.push(`Row ${i + 1}: invalid level "${levelRaw}", defaulting to "easy".`);
    }
    const level = VALID_LEVELS.includes(levelLower as typeof VALID_LEVELS[number]) 
      ? levelLower as CSVParseRow['level'] 
      : 'easy';
    console.log(`[DEBUG CSV] Row ${i + 1}: Final level="${level}"`);
    const optionA = get(col.optionA);
    const optionB = get(col.optionB);
    const optionC = col.optionC !== -1 ? get(col.optionC) : '';
    const optionD = col.optionD !== -1 ? get(col.optionD) : '';
    const correctAnswerRaw = get(col.correctAnswer);
    const chapter = (col.chapter !== -1 ? get(col.chapter) : '') || subjectName || 'General';

    // ── Validate by level ────────────────────────────────────────────────────

    // extreme: no options expected. Correct Answer column holds the open answer text.
    // NOTE: For extreme, the "Correct Answer" column MUST contain the actual answer text, not a letter!
    if (level === 'extreme') {
      console.log(`[DEBUG CSV] Row ${i + 1}: Processing EXTREME - correctAnswerRaw="${correctAnswerRaw}"`);
      if (!correctAnswerRaw || correctAnswerRaw.length === 0) {
        warnings.push(`Row ${i + 1}: extreme question has no answer text in "Correct Answer" column - use the actual answer text, not a letter. Skipping.`);
        continue;
      }
      // Check if they accidentally used a letter instead of text
      if (['A', 'B', 'C', 'D'].includes(correctAnswerRaw.toUpperCase())) {
        warnings.push(`Row ${i + 1}: extreme question uses letter "${correctAnswerRaw}" but should use actual answer TEXT. Using as-is.`);
      }
      rows.push({ questionText, optionA: '', optionB: '', optionC: '', optionD: '', correctAnswerRaw, level, chapter });
      continue;
    }

    // All other levels need at least Option A
    if (!optionA) {
      warnings.push(`Row ${i + 1} (${level}): missing Option A, skipping.`);
      continue;
    }

    // easy: may be True/False
    if (level === 'easy') {
      if (isTFToken(optionA) || isTFToken(optionB)) {
        // Normalize True/False options
        const normA = normalizeTFToken(optionA);
        const normB = optionB ? normalizeTFToken(optionB) : (normA === 'True' ? 'False' : 'True');
        // Determine correct letter (A=True, B=False OR based on raw letter)
        let correctLetter = correctAnswerRaw.toUpperCase();
        if (correctAnswerRaw.toUpperCase() === 'TRUE' || correctAnswerRaw.toUpperCase() === 'T') {
          // find which slot is "True"
          correctLetter = normA === 'True' ? 'A' : 'B';
        } else if (correctAnswerRaw.toUpperCase() === 'FALSE' || correctAnswerRaw.toUpperCase() === 'F') {
          correctLetter = normA === 'False' ? 'A' : 'B';
        }
        // Default to A if still unrecognized
        if (correctLetter !== 'A' && correctLetter !== 'B') correctLetter = 'A';
        rows.push({ questionText, optionA: normA, optionB: normB, optionC: '', optionD: '', correctAnswerRaw: correctLetter, level, chapter });
        continue;
      }
      // Otherwise treat as medium (2-option multiple choice)
    }

    // medium/hard/expert/easy (non-TF): need at least B
    if (!optionB) {
      warnings.push(`Row ${i + 1} (${level}): missing Option B, skipping.`);
      continue;
    }

    // Validate number of options based on level
    const hasC = !!optionC;
    const hasD = !!optionD;

    if (level === 'medium' && (hasC || hasD)) {
      warnings.push(`Row ${i + 1} (medium): medium level should have 2 options, but C/D are provided. Using first 2.`);
    }
    if (level === 'hard' && !hasC) {
      warnings.push(`Row ${i + 1} (hard): hard level requires 3 options (A,B,C). Missing Option C.`);
    }
    if (level === 'hard' && hasD) {
      warnings.push(`Row ${i + 1} (hard): hard level has 4 options, but should have 3. Using first 3.`);
    }
    if (level === 'expert' && (!hasC || !hasD)) {
      warnings.push(`Row ${i + 1} (expert): expert level requires 4 options (A,B,C,D). Missing options.`);
    }

    // Correct answer letter must be a valid option letter
    const correctLetter = correctAnswerRaw.toUpperCase().charAt(0);
    if (!['A', 'B', 'C', 'D'].includes(correctLetter)) {
      warnings.push(`Row ${i + 1}: invalid correct answer "${correctAnswerRaw}", defaulting to A.`);
    }

    rows.push({ questionText, optionA, optionB, optionC, optionD, correctAnswerRaw: correctLetter || 'A', level, chapter });
  }

  return { subjectName, rows, errors, warnings };
}

// ─── Step 2 – Full import (parse + save to DB) ───────────────────────────────

export async function importQuestionsFromCSV(
  csvContent: string,
  existingSubjects: Subject[]
): Promise<CSVImportResult> {
  // 1. Parse CSV content
  const parsed = parseCSVContent(csvContent);

  if (parsed.errors.length > 0 || parsed.rows.length === 0) {
    return {
      success: false,
      subjectName: parsed.subjectName,
      subjectSlug: '',
      questionsImported: 0,
      chaptersCreated: 0,
      errors: parsed.errors.length > 0 ? parsed.errors : ['No valid questions found in CSV.'],
      warnings: parsed.warnings,
    };
  }

  const { subjectName, rows } = parsed;
  const subjectSlug = generateSlug(subjectName);
  const errors: string[] = [];
  const warnings: string[] = [...parsed.warnings];

  // 2. Find or create the subject
  let subjectId: string | undefined;

  // Check local state first
  const localSubject = existingSubjects.find(
    s => s.slug === subjectSlug || s.name.toLowerCase() === subjectName.toLowerCase()
  );
  if (localSubject?.id) {
    subjectId = localSubject.id;
  }

  // Always verify against the API (subject may exist in DB but not in local state)
  try {
    const apiSubject = await getSubjectBySlug(subjectSlug);
    if (apiSubject?.id) {
      subjectId = apiSubject.id;
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const isNotFound = errorMessage.includes('404') || 
                       errorMessage.includes('not found') || 
                       errorMessage.toLowerCase().includes('not found');
    
    if (!isNotFound) {
      errors.push(`API Error while checking subject: ${errorMessage}`);
    }
  }

  if (!subjectId) {
    try {
      const created = await createSubject({
        name: subjectName,
        slug: subjectSlug,
        emoji: '📚',
        category: 'academic',
      });
      subjectId = created.id;
    } catch (err) {
      return {
        success: false,
        subjectName,
        subjectSlug,
        questionsImported: 0,
        chaptersCreated: 0,
        errors: [`Failed to create subject "${subjectName}": ${err}`],
        warnings: parsed.warnings,
      };
    }
  }

  // 3. Find or create chapters
  let existingChapters = await getChaptersBySubject(subjectId!).catch(() => []);
  const chapterMap = new Map(existingChapters.map(c => [c.name.toLowerCase(), c.id]));
  let chaptersCreated = 0;

  const uniqueChapters = [...new Set(rows.map(r => r.chapter))];
  for (const chapterName of uniqueChapters) {
    const key = chapterName.toLowerCase();
    if (!chapterMap.has(key)) {
      try {
        const newChapter = await createChapter({ name: chapterName, subjectId: subjectId! });
        // Ensure the chapter has a valid id before adding to map
        if (newChapter && newChapter.id) {
          chapterMap.set(key, newChapter.id);
          chaptersCreated++;
        } else {
          errors.push(`Chapter "${chapterName}" was created but returned no ID`);
        }
      } catch (err) {
        errors.push(`Failed to create chapter "${chapterName}": ${err}`);
      }
    }
  }

  // If no chapters were found or created, create a default "General" chapter
  if (chapterMap.size === 0) {
    try {
      const defaultChapter = await createChapter({ name: 'General', subjectId: subjectId! });
      if (defaultChapter && defaultChapter.id) {
        chapterMap.set('general', defaultChapter.id);
        chaptersCreated++;
      }
    } catch (err) {
      errors.push(`Failed to create default chapter: ${err}`);
    }
  }

  // 4. Build API payloads
  type QuestionPayload = {
    question: string;
    correctAnswer: string;
    options: string[];
    level: 'easy' | 'medium' | 'hard' | 'expert' | 'extreme';
    chapterId: string;
    status: 'published';
    order?: number;
  };

  const rawPayload = rows.map((row, idx): QuestionPayload | null => {
    const chapterKey = row.chapter.toLowerCase();
    let chapterId: string | undefined = chapterMap.get(chapterKey);

    // If chapter not found, try to use any available chapter or create a default
    if (!chapterId) {
      const availableChapters = Array.from(chapterMap.values());
      if (availableChapters.length > 0 && availableChapters[0]) {
        chapterId = availableChapters[0];
        warnings.push(`Row ${idx + 1}: Chapter "${row.chapter}" not found, using first available chapter`);
      } else {
        errors.push(`Row ${idx + 1}: No chapters available for subject - skipping`);
        return null;
      }
    }

    // TypeScript guarantee - chapterId is now defined
    const finalChapterId = chapterId;

    // extreme: no options, correctAnswer is open text
    if (row.level === 'extreme') {
      return {
        question: row.questionText,
        correctAnswer: row.correctAnswerRaw,
        options: [],
        level: row.level,
        chapterId: finalChapterId,
        status: 'published',
      };
    }

    // Build options map
    const letterToOption: Record<string, string> = {
      A: row.optionA,
      B: row.optionB,
      C: row.optionC,
      D: row.optionD,
    };

    const correctLetter = row.correctAnswerRaw.toUpperCase();
    const correctAnswerText = letterToOption[correctLetter] || row.optionA;

    // options = all options exactly A, B, C, D
    const options: string[] = [row.optionA, row.optionB, row.optionC, row.optionD].filter(o => o);

    return {
      question: row.questionText,
      correctAnswer: correctAnswerText,
      options,
      level: row.level,
      chapterId: finalChapterId,
      status: 'published',
    };
  });

  const questionsPayload: QuestionPayload[] = rawPayload.filter(
    (q): q is QuestionPayload => q !== null
  );

  if (questionsPayload.length === 0) {
    return {
      success: false,
      subjectName,
      subjectSlug,
      questionsImported: 0,
      chaptersCreated,
      errors: errors.length > 0 ? errors : ['No valid questions could be prepared for import.'],
      warnings: parsed.warnings,
    };
  }

  // 5. Bulk save to database
  try {
    await createQuestionsBulk(questionsPayload);
    return {
      success: true,
      subjectName,
      subjectSlug,
      questionsImported: questionsPayload.length,
      chaptersCreated,
      errors,
      warnings: parsed.warnings,
    };
  } catch (err) {
    return {
      success: false,
      subjectName,
      subjectSlug,
      questionsImported: 0,
      chaptersCreated,
      errors: [`Failed to bulk-save questions: ${err}`],
      warnings: parsed.warnings,
    };
  }
}
