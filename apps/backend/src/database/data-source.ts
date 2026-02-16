/**
 * ============================================================================
 * Data Source Configuration
 * ============================================================================
 * Main TypeORM data source configuration for:
 * - Application runtime
 * - CLI operations (migrations)
 * - Scripts
 * 
 * SECURITY: All credentials from environment variables, no hardcoded defaults
 * ============================================================================
 */

import { DataSource } from 'typeorm';
import { getCliDatabaseConfig, validateDatabaseEnv } from './database-config';

// Validate environment variables before creating data source
validateDatabaseEnv();

// Export configuration options for use in other modules
export const _dataSourceOptions = getCliDatabaseConfig();

// Create and export the data source instance
const _dataSource = new DataSource(_dataSourceOptions);

export default _dataSource;
