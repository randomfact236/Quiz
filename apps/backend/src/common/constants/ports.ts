/**
 * ============================================================================
 * Centralized Port Configuration
 * ============================================================================
 * All port numbers for the AI Quiz application are defined here.
 * 
 * To change ports system-wide, modify only this file.
 * 
 * Port Usage:
 * - 3010: Frontend (Next.js) - handled by Next.js directly
 * - 3012: Backend API (NestJS) - THIS FILE controls this
 * - 4000: Alternative Backend API (for future use)
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

/** Alternative Backend API Port */
export const ALT_BACKEND_PORT = parseInt(process.env.ALT_BACKEND_PORT || '4000', 10);

/**
 * Get the API URL for the backend
 * Uses environment variable or constructs from BACKEND_PORT
 */
export function getApiUrl(): string {
  return process.env.API_URL || `http://localhost:${BACKEND_PORT}/api`;
}

/**
 * Get the frontend URL
 * Uses environment variable or constructs from FRONTEND_PORT
 */
export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || `http://localhost:${FRONTEND_PORT}`;
}

// Re-export for backwards compatibility
export const SERVER_PORT = BACKEND_PORT;
