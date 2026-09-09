/**
 * ============================================================================
 * admin/lib/import-export.ts — image riddle import/export specifics
 * ============================================================================
 * CSV/JSON config, exporters, and the CSV parser for image riddles. Pure.
 * ============================================================================
 */

import type { ImageRiddle, ImportExportConfig, ImportResult } from '@/app/admin/types';

import { exportToCSV, importFromCSV } from './csv';
import { exportToJSON } from './json';

/** Image Riddle Import/Export Config */
export const imageRiddleConfig: ImportExportConfig<ImageRiddle> = {
  entityName: 'ImageRiddle',
  filePrefix: 'image-riddles',
  csvHeaders: [
    'ID',
    'Title',
    'ImageUrl',
    'Answer',
    'AlternativeAnswers',
    'AltText',
    'Hint',
    'Difficulty',
    'Category',
    'TimerSeconds',
    'ShowTimer',
    'IsActive',
  ],
  // Explicit accessors: camelCase properties and the nested category object
  // made the legacy lowercase-header heuristic export empty/[object Object].
  csvExportColumns: [
    { header: 'ID', get: (r) => r['id'] },
    { header: 'Title', get: (r) => r['title'] },
    { header: 'ImageUrl', get: (r) => r['imageUrl'] },
    { header: 'Answer', get: (r) => r['answer'] },
    { header: 'AlternativeAnswers', get: (r) => (r['alternativeAnswers'] ?? []).join('|') },
    { header: 'AltText', get: (r) => r['altText'] },
    { header: 'Hint', get: (r) => r['hint'] },
    { header: 'Difficulty', get: (r) => r['difficulty'] },
    { header: 'Category', get: (r) => r['category']?.name },
    { header: 'TimerSeconds', get: (r) => r['timerSeconds'] },
    { header: 'ShowTimer', get: (r) => (r['showTimer'] ? 'true' : 'false') },
    { header: 'IsActive', get: (r) => (r['isActive'] ? 'true' : 'false') },
  ],
  jsonRootKey: 'imageRiddles',
  validators: {
    required: ['title', 'imageUrl', 'answer', 'difficulty', 'category'],
    enumFields: { difficulty: ['easy', 'medium', 'hard', 'expert'] },
    maxLength: { title: 500, answer: 500, hint: 1000, category: 100 },
  },
};

/**
 * Convert image riddles to CSV format
 */
export function imageRiddlesToCSV(riddles: ImageRiddle[]): string {
  return exportToCSV(
    riddles as unknown as Record<string, unknown>[],
    imageRiddleConfig as unknown as ImportExportConfig<Record<string, unknown>>,
    { count: riddles.length.toString() }
  );
}

/**
 * Convert image riddles to JSON format
 */
export function imageRiddlesToJSON(riddles: ImageRiddle[]): string {
  return exportToJSON(riddles, imageRiddleConfig, { count: riddles.length });
}

/** Test/preview-friendly id generator with the original fallback logic. */
export function generateRiddleId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : String(Date.now() + Math.floor(Math.random() * 1000));
}

/**
 * Parse image riddle CSV
 */
export function parseImageRiddleCSV(csvText: string): ImportResult<ImageRiddle> {
  const result = importFromCSV(
    csvText,
    imageRiddleConfig as unknown as ImportExportConfig<Record<string, unknown>>,
    (values, headers) => {
      const getValue = (_index: number, headerName: string): string => {
        const headerIndex = headers.findIndex((h) =>
          h.toLowerCase().includes(headerName.toLowerCase())
        );
        return headerIndex !== -1 && headerIndex < values.length ? (values[headerIndex] ?? '') : '';
      };

      return {
        id: generateRiddleId(),
        title: getValue(1, 'title'),
        imageUrl: getValue(2, 'imageurl'),
        answer: getValue(3, 'answer'),
        alternativeAnswers: getValue(4, 'alternativeanswers')
          ? getValue(4, 'alternativeanswers').split('|').filter(Boolean)
          : [],
        altText: getValue(5, 'alttext') || undefined,
        hint: getValue(6, 'hint'),
        difficulty: (getValue(7, 'difficulty') || 'medium') as ImageRiddle['difficulty'],
        category: { name: getValue(8, 'category') || 'General', emoji: '🔍' },
        timerSeconds: parseInt(getValue(9, 'timerseconds')) || 90,
        showTimer: getValue(10, 'showtimer')?.toLowerCase() === 'true',
        isActive: getValue(11, 'isactive')?.toLowerCase() !== 'false',
      };
    }
  );
  return result as unknown as ImportResult<ImageRiddle>;
}
