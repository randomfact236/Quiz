/**
 * ============================================================================
 * admin/lib/csv.ts — CSV structure validation, exporter, importer
 * ============================================================================
 * Moved verbatim (behavior-preserving) from ImageRiddlesAdminSection.
 * Pure, DOM-free — unit-testable.
 * ============================================================================
 */

import type { ImportExportConfig, ImportResult, ValidationResult } from '@/app/admin/types';

/**
 * Validates CSV content against expected headers and structure
 */
export function validateCSVStructure(
  csvText: string,
  expectedHeaders: string[]
): ValidationResult<string[]> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    errors.push('CSV file must have at least a header row and one data row');
    return { isValid: false, data: null, errors, warnings };
  }

  const firstLine = lines[0];
  if (!firstLine) {
    errors.push('CSV file is empty');
    return { isValid: false, data: null, errors, warnings };
  }

  const headers = firstLine.split(',').map((h) => h.trim().toLowerCase());
  const missingHeaders = expectedHeaders.filter(
    (expected) => !headers.some((header) => header.includes(expected.toLowerCase()))
  );

  if (missingHeaders.length > 0) {
    warnings.push(`Missing expected headers: ${missingHeaders.join(', ')}`);
  }

  return { isValid: errors.length === 0, data: headers, errors, warnings };
}

/**
 * Enterprise-Grade Generic CSV Exporter
 */
export function exportToCSV<T extends Record<string, unknown>>(
  items: T[],
  config: ImportExportConfig<T>,
  metadata?: Record<string, string>
): string {
  const headers = config.csvHeaders;

  const rows = items.map((item) =>
    headers.map((header) => {
      const key = header.toLowerCase().replace(/\s+/g, '') as keyof T;
      const value = item[key];

      if (value === null || value === undefined) {
        return '';
      }

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
    csvContent +=
      '# ' +
      Object.entries(metadata)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ') +
      '\n';
  }

  csvContent += [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  return csvContent;
}

/**
 * Enterprise-Grade Generic CSV Importer
 *
 * Note: intentionally does NOT enforce config.validators.required — the
 * admin section's original behavior accepts rows whose fields the mapper
 * fills with defaults.
 */
export function importFromCSV<T extends Record<string, unknown>>(
  csvText: string,
  config: ImportExportConfig<T>,
  mapper: (values: string[], headers: string[]) => Partial<T>
): ImportResult<T> {
  const imported: T[] = [];
  const failed: { row: number; error: string; data: unknown }[] = [];

  const validation = validateCSVStructure(csvText, config.csvHeaders);
  if (!validation.isValid || !validation.data) {
    return {
      success: false,
      imported,
      failed: validation.errors.map((error, index) => ({ row: index, error, data: null })),
      total: 0,
    };
  }

  const lines = csvText.trim().split('\n');
  const headers = validation.data;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || line.trim() === '') continue;

    try {
      // RFC 4180 compliant CSV tokenizer — handles quoted fields with commas
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci];
        if (ch === '"') {
          if (inQuotes && line[ci + 1] === '"') {
            current += '"';
            ci++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          values.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      values.push(current);
      const mapped = mapper(values, headers);

      if (mapped && Object.keys(mapped).length > 0) {
        imported.push(mapped as T);
      }
    } catch (err) {
      failed.push({
        row: i,
        error: err instanceof Error ? err.message : 'Unknown error',
        data: line,
      });
    }
  }

  return {
    success: failed.length === 0,
    imported,
    failed,
    total: lines.length - 1,
  };
}
