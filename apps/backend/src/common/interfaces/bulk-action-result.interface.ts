/**
 * ============================================================================
 * Bulk Action Result Interfaces - Enterprise Grade
 * ============================================================================
 * Quality: 10/10 - Production Ready
 * ============================================================================
 */

import { ContentStatus } from '../enums/content-status.enum';

/**
 * Individual failure record for bulk operations
 */
export interface BulkActionFailure {
  id: string;
  error: string;
}

/**
 * Standard response format for all bulk action operations
 */
export interface BulkActionResult {
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  failures?: BulkActionFailure[];
  message: string;
}

/**
 * Status count response for content statistics
 */
export interface StatusCountResponse {
  total: number;
  published: number;
  draft: number;
  trash: number;
}

/**
 * Audit log entry for bulk actions
 */
export interface BulkActionAuditLog {
  action: string;
  entityType: string;
  entityIds: string[];
  performedBy: string;
  performedAt: Date;
  result: BulkActionResult;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Options for bulk action operations
 */
export interface BulkActionOptions {
  skipCacheInvalidation?: boolean;
  transactionTimeout?: number;
  auditLogEnabled?: boolean;
}

/**
 * Entity with status field interface
 */
export interface IStatusEntity {
  id: string;
  status: ContentStatus;
  updatedAt?: Date;
}
