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
    'Hint',
    'Difficulty',
    'Category',
    'TimerSeconds',
    'ShowTimer',
    'IsActive',
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
        hint: getValue(4, 'hint'),
        difficulty: (getValue(5, 'difficulty') || 'medium') as ImageRiddle['difficulty'],
        category: { name: getValue(6, 'category') || 'General', emoji: '🔍' },
        timerSeconds: parseInt(getValue(7, 'timerseconds')) || 90,
        showTimer: getValue(8, 'showtimer')?.toLowerCase() === 'true',
        isActive: getValue(9, 'isactive')?.toLowerCase() !== 'false',
      };
    }
  );
  return result as unknown as ImportResult<ImageRiddle>;
}
