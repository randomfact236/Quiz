#!/bin/bash
# =============================================================================
# AI Quiz Platform - Connection Fix Launcher (Linux/Mac)
# =============================================================================
# Run this script to automatically diagnose and fix connection issues
#
# Usage:
#   ./fix-connection.sh
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║           AI Quiz Platform - Connection Auto-Fix                 ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if PowerShell is available (for cross-platform script)
if command -v pwsh &> /dev/null; then
    POWERSHELL="pwsh"
elif command -v powershell &> /dev/null; then
    POWERSHELL="powershell"
else
    echo -e "${RED}[ERROR] PowerShell is not installed.${NC}"
    echo "Please install PowerShell:"
    echo "  Ubuntu/Debian: sudo apt-get install -y powershell"
    echo "  macOS: brew install --cask powershell"
    echo "  Or visit: https://docs.microsoft.com/powershell/scripting/install/"
    exit 1
fi

echo -e "${BLUE}Starting automatic diagnostic and repair...${NC}"
echo ""

# Run the auto-fix loop with 3 attempts
$POWERSHELL -ExecutionPolicy Bypass -File "${SCRIPT_DIR}/scripts/auto-fix-loop.ps1" -MaxAttempts 3 -WaitBetween 10

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}[SUCCESS] Connection issues have been resolved!${NC}"
    echo ""
    echo "The AI Quiz Platform should now be accessible at:"
    echo "  - http://localhost:3010"
    echo ""
    read -p "Would you like to open the browser now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Try different methods to open browser
        if command -v xdg-open &> /dev/null; then
            xdg-open http://localhost:3010
        elif command -v open &> /dev/null; then
            open http://localhost:3010
        else
            echo "Please manually open: http://localhost:3010"
        fi
    fi
else
    echo ""
    echo -e "${RED}[FAILED] Could not automatically resolve the issue.${NC}"
    echo ""
    echo "Please check the logs above for specific error messages."
    echo "You can also try running manually:"
    echo "  docker-compose down -v"
    echo "  docker-compose up -d --build"
    echo ""
    echo "For detailed help, see: DEPLOYMENT.md"
    echo ""
fi

exit $EXIT_CODE
