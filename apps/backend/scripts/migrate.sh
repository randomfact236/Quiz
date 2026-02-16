#!/bin/bash
# =============================================================================
# AI Quiz Platform - Database Migration Script
# =============================================================================
# This script runs database migrations for the backend
# It can be used both in Docker and locally
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "═══════════════════════════════════════════════════════════════"
echo "           AI Quiz Platform - Database Migration"
echo "═══════════════════════════════════════════════════════════════"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're running in Docker
if [ -f "/.dockerenv" ]; then
    echo -e "${BLUE}Running inside Docker container${NC}"
    cd /app/apps/backend
else
    echo -e "${BLUE}Running locally${NC}"
    cd "${BACKEND_DIR}"
fi

# Wait for database to be ready
echo -e "${BLUE}Checking database connection...${NC}"
MAX_RETRIES=30
RETRY_COUNT=0

while ! npx typeorm-ts-node-commonjs query "SELECT 1" -d src/database/data-source.ts > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo -e "${RED}Failed to connect to database after $MAX_RETRIES attempts${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Database not ready, retrying... ($RETRY_COUNT/$MAX_RETRIES)${NC}"
    sleep 2
done

echo -e "${GREEN}Database connection successful!${NC}"

# Show pending migrations
echo ""
echo -e "${BLUE}Checking pending migrations...${NC}"
npx typeorm-ts-node-commonjs migration:show -d src/database/data-source.ts || true

# Run migrations
echo ""
echo -e "${BLUE}Running migrations...${NC}"
npx typeorm-ts-node-commonjs migration:run -d src/database/data-source.ts

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}           Migrations completed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
