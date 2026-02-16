-- =============================================================================
-- AI Quiz Platform - PostgreSQL Initialization
-- =============================================================================
-- This script runs when the PostgreSQL container is first created
-- It sets up the initial database configuration
-- =============================================================================

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- Create a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Grant necessary permissions (if using a specific user)
-- Note: The default user from docker-compose already has full permissions

-- Create additional indexes for performance (optional, TypeORM will create most)
-- These can be added here if needed for specific queries

-- =============================================================================
-- Health Check Function
-- =============================================================================
CREATE OR REPLACE FUNCTION health_check()
RETURNS TABLE (
    status TEXT,
    timestamp TIMESTAMPTZ,
    database_name TEXT,
    version TEXT
) AS $$
BEGIN
    RETURN QUERY SELECT 
        'healthy'::TEXT,
        CURRENT_TIMESTAMP,
        current_database(),
        version();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Comment for documentation
-- =============================================================================
COMMENT ON FUNCTION health_check() IS 'Returns database health status for monitoring';
