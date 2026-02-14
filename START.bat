@echo off
echo ========================================
echo   AI Quiz Platform - Server Launcher
echo ========================================
echo.
echo Starting servers with automatic health checks...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0launch-servers.ps1"
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERROR: Failed to start servers
    echo ========================================
    pause
    exit /b 1
)
pause
