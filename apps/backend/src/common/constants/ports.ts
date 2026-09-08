/**
 * ============================================================================
 * Centralized Port Configuration
 * ============================================================================
 * All port numbers for the AI Quiz application are defined here.
 *
 * To change ports system-wide, modify only this file.
 *
 * Port Usage:
 * - 3010: Frontend (Next.js)
 * - 3012: Backend API (NestJS)
 * - 5432: PostgreSQL Database
 * - 6379: Redis Cache
 * ============================================================================
 */

/** Backend API Server Port */
export const BACKEND_PORT = parseInt(process.env.PORT || '3012', 10);

/** Frontend Port (Next.js) */
export const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '3010', 10);

/** Database Port */
export const DATABASE_PORT = parseInt(process.env.DATABASE_PORT || '5432', 10);

/** Redis Port */
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
// Re-export for backwards compatibility
export const SERVER_PORT = BACKEND_PORT;
