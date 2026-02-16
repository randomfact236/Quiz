/**
 * ============================================================================
 * Database Configuration - Secure
 * ============================================================================
 * Centralized database configuration with security best practices:
 * - No hardcoded credentials
 * - Environment variable validation
 * - Secure defaults
 * ============================================================================
 */

import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { DB_PORT, DB_POOL_SIZE } from '../common/constants/app.constants';

// Load environment variables
dotenv.config();

/**
 * Required database environment variables
 */
const REQUIRED_ENV_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_DATABASE',
];

/**
 * Validate that all required environment variables are set
 * @throws Error if any required variable is missing
 */
export function validateDatabaseEnv(): void {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}\n` +
      `Please ensure all required variables are set in your .env file.`
    );
  }
}

/**
 * Get database configuration with validation
 * @param options Additional configuration options
 * @returns DataSourceOptions for TypeORM
 */
export function getDatabaseConfig(
  options: {
    synchronize?: boolean;
    logging?: boolean;
    migrations?: string[];
    entities?: string[];
  } = {},
): DataSourceOptions {
  // Validate environment variables
  validateDatabaseEnv();

  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';

  // Security: Never synchronize in production
  // DEVELOPMENT ONLY: Enable synchronize to auto-create tables
  const synchronize = options.synchronize ?? (isDevelopment ? true : false);

  // Logging: Only enable in development, never in production
  const logging = options.logging ?? (isDevelopment && !isProduction);

  return {
    type: 'postgres',
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT!, 10),
    username: process.env.DB_USERNAME!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_DATABASE!,
    entities: options.entities || ['src/**/*.entity{.ts,.js}'],
    migrations: options.migrations || ['src/database/migrations/*{.ts,.js}'],
    synchronize,
    logging,
    poolSize: DB_POOL_SIZE,
    // Additional security settings
    ssl: isProduction ? { rejectUnauthorized: false } : false,
    // Connection timeout settings
    connectTimeoutMS: 10000,
    // Logging configuration
    logger: 'advanced-console',
  };
}

/**
 * Get database configuration for CLI operations (migrations, seeds)
 * Uses stricter security settings
 */
export function getCliDatabaseConfig(): DataSourceOptions {
  return getDatabaseConfig({
    synchronize: false, // Never auto-sync in CLI
    logging: process.env.DB_LOGGING === 'true',
  });
}

/**
 * Get database configuration for seeding
 * WARNING: Only use in controlled environments
 */
export function getSeedDatabaseConfig(): DataSourceOptions {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Security: Prevent accidental seeding in production
  if (nodeEnv === 'production') {
    throw new Error(
      'Seeding is not allowed in production environment.\n' +
      'If you really need to seed, set NODE_ENV to "development" temporarily.'
    );
  }

  return getDatabaseConfig({
    synchronize: false, // Don't auto-sync, use migrations
    logging: true,
  });
}

/**
 * Check if database configuration is valid
 * @returns boolean indicating if all required variables are set
 */
export function isDatabaseConfigValid(): boolean {
  try {
    validateDatabaseEnv();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get safe database info for logging (masks sensitive data)
 */
export function getSafeDatabaseInfo(): Record<string, string> {
  return {
    host: process.env.DB_HOST || 'not set',
    port: process.env.DB_PORT || 'not set',
    database: process.env.DB_DATABASE || 'not set',
    username: process.env.DB_USERNAME ? '***' : 'not set',
    password: process.env.DB_PASSWORD ? '***' : 'not set',
  };
}
