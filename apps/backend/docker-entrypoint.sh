#!/bin/sh
# =============================================================================
# AI Quiz Platform - Backend Docker Entrypoint
# =============================================================================
# This script runs before the backend starts to:
# 1. Wait for database to be ready
# 2. Run database migrations (optional)
# 3. Start the application
# =============================================================================

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "           AI Quiz Platform - Backend Startup"
echo "═══════════════════════════════════════════════════════════════"

# Colors (if terminal supports it)
if [ -t 1 ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    NC=''
fi

# Configuration
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}
DB_USERNAME=${DB_USERNAME:-aiquiz}
DB_DATABASE=${DB_DATABASE:-aiquiz}
MAX_RETRIES=${DB_MAX_RETRIES:-30}
RETRY_DELAY=${DB_RETRY_DELAY:-2}

# Check if we should skip migrations
SKIP_MIGRATIONS=${SKIP_MIGRATIONS:-false}

echo "${BLUE}Configuration:${NC}"
echo "  Database Host: $DB_HOST"
echo "  Database Port: $DB_PORT"
echo "  Database User: $DB_USERNAME"
echo "  Database Name: $DB_DATABASE"
echo "  Skip Migrations: $SKIP_MIGRATIONS"
echo ""

# =============================================================================
# Wait for Database
# =============================================================================
echo "${BLUE}Waiting for PostgreSQL to be ready...${NC}"

RETRY_COUNT=0
while ! nc -z $DB_HOST $DB_PORT; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "${RED}ERROR: Database connection failed after $MAX_RETRIES attempts${NC}"
        exit 1
    fi
    echo "${YELLOW}  Database not ready, retrying... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep $RETRY_DELAY
done

echo "${GREEN}✓ Database is ready!${NC}"
echo ""

# =============================================================================
# Wait for Redis (if configured)
# =============================================================================
if [ -n "$REDIS_HOST" ]; then
    echo "${BLUE}Waiting for Redis to be ready...${NC}"
    
    REDIS_PORT=${REDIS_PORT:-6379}
    RETRY_COUNT=0
    
    while ! nc -z $REDIS_HOST $REDIS_PORT; do
        RETRY_COUNT=$((RETRY_COUNT + 1))
        if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
            echo "${RED}ERROR: Redis connection failed after $MAX_RETRIES attempts${NC}"
            exit 1
        fi
        echo "${YELLOW}  Redis not ready, retrying... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
        sleep $RETRY_DELAY
    done
    
    echo "${GREEN}✓ Redis is ready!${NC}"
    echo ""
fi

# =============================================================================
# Run Migrations
# =============================================================================
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    echo "${BLUE}Running database migrations...${NC}"
    
    if npm run migration:run 2>&1; then
        echo "${GREEN}✓ Migrations completed successfully!${NC}"
    else
        echo "${YELLOW}⚠ Migration command failed or no migrations to run${NC}"
        echo "${YELLOW}  Continuing with startup...${NC}"
    fi
    echo ""
else
    echo "${YELLOW}⚠ Skipping migrations (SKIP_MIGRATIONS=true)${NC}"
    echo ""
fi

# =============================================================================
# Start Application
# =============================================================================
echo "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo "${GREEN}           Starting AI Quiz Platform Backend${NC}"
echo "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Execute the main command
exec "$@"
