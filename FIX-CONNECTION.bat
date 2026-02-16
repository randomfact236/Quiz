@echo off
:: =============================================================================
:: AI Quiz Platform - Connection Fix Launcher
:: =============================================================================
:: Double-click this file to automatically diagnose and fix connection issues
:: =============================================================================

title AI Quiz Platform - Connection Fix

echo.
echo  ╔══════════════════════════════════════════════════════════════════╗
echo  ║           AI Quiz Platform - Connection Auto-Fix                 ║
echo  ╚══════════════════════════════════════════════════════════════════╝
echo.

:: Check if PowerShell is available
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell is not available on this system.
    pause
    exit /b 1
)

:: Run the auto-fix loop with 3 attempts
echo Starting automatic diagnostic and repair...
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\auto-fix-loop.ps1" -MaxAttempts 3 -WaitBetween 10

if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Connection issues have been resolved!
    echo.
    echo The AI Quiz Platform should now be accessible at:
    echo   - http://localhost:3010
    echo.
    choice /C YN /M "Would you like to open the browser now"
    if %errorlevel% equ 1 (
        start http://localhost:3010
    )
) else (
    echo.
    echo [FAILED] Could not automatically resolve the issue.
    echo.
    echo Please check the logs above for specific error messages.
    echo You can also try running manually:
    echo   docker-compose down -v
    echo   docker-compose up -d --build
    echo.
    echo For detailed help, see: DEPLOYMENT.md
    echo.
)

pause
