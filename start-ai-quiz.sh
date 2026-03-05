#!/bin/bash
# ============================================================================
# AI Quiz - Development Server Automation Script
# ============================================================================
# This script handles building and running both frontend and backend servers
# 
# Usage:
#   ./start-ai-quiz.sh           - Start both frontend and backend
#   ./start-ai-quiz.sh backend   - Start only backend
#   ./start-ai-quiz.sh frontend  - Start only frontend
#   ./start-ai-quiz.sh build     - Build both applications
#   ./start-ai-quiz.sh test      - Run TypeScript checks
# ============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_ROOT"

echo ""
echo "========================================"
echo "  AI Quiz - Development Server"
echo "========================================"
echo ""

case "$1" in
    ""|both)
        echo "Starting both frontend and backend..."
        echo ""
        cd "$PROJECT_ROOT/apps/backend" && npm run start:dev &
        BACKEND_PID=$!
        sleep 3
        cd "$PROJECT_ROOT/apps/frontend" && npm run dev &
        FRONTEND_PID=$!
        echo ""
        echo "Both servers starting!"
        echo "- Backend: http://localhost:4000"
        echo "- Frontend: http://localhost:3000"
        echo ""
        echo "Press Ctrl+C to stop all servers"
        wait
        ;;
    backend)
        echo "Starting backend server..."
        echo ""
        cd "$PROJECT_ROOT/apps/backend"
        npm run start:dev
        ;;
    frontend)
        echo "Starting frontend server..."
        echo ""
        cd "$PROJECT_ROOT/apps/frontend"
        npm run dev
        ;;
    build)
        echo "Building both applications..."
        echo ""
        echo "[1/2] Building backend..."
        cd "$PROJECT_ROOT/apps/backend"
        npm run build
        echo "Backend build SUCCESS"
        echo ""
        echo "[2/2] Building frontend..."
        cd "$PROJECT_ROOT/apps/frontend"
        npm run build
        echo "Frontend build SUCCESS"
        echo ""
        echo "========================================"
        echo "  Build Complete!"
        echo "========================================"
        ;;
    test)
        echo "Running TypeScript checks..."
        echo ""
        echo "[1/2] Checking backend..."
        cd "$PROJECT_ROOT/apps/backend"
        npx tsc --noEmit --skipLibCheck
        echo "Backend check SUCCESS"
        echo ""
        echo "[2/2] Checking frontend..."
        cd "$PROJECT_ROOT/apps/frontend"
        npx tsc --noEmit --skipLibCheck
        echo "Frontend check SUCCESS"
        echo ""
        echo "========================================"
        echo "  All Checks Passed!"
        echo "========================================"
        ;;
    *)
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  (none)    - Start both frontend and backend"
        echo "  backend    - Start only backend server"
        echo "  frontend   - Start only frontend server"
        echo "  build      - Build both applications"
        echo "  test       - Run TypeScript checks"
        echo ""
        echo "Examples:"
        echo "  $0"
        echo "  $0 backend"
        echo "  $0 build"
        exit 1
        ;;
esac
