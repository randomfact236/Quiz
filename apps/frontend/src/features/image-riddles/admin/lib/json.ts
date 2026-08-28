/**
 * ============================================================================
 * admin/lib/json.ts — JSON structure validation + exporter
 * ============================================================================
 * Moved verbatim (behavior-preserving) from ImageRiddlesAdminSection.
 * ============================================================================
 */

import type { ImportExportConfig, ValidationResult } from '@/app/admin/types';

/**
 * Validates JSON content structure
 */
export function validateJSONStructure<T>(
  jsonText: string,
  rootKey?: string
): ValidationResult<T[]> {
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
      warnings,
    };
  } catch (err) {
    errors.push(`Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return { isValid: false, data: null, errors, warnings };
  }
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
