@echo off
chcp 65001 >nul
title AI Quiz Server Auto-Connect
echo.
echo ╔════════════════════════════════════════╗
echo ║     AI Quiz Server Auto-Connect        ║
echo ╚════════════════════════════════════════╝
echo.
echo Starting servers and monitoring...
echo.
echo This will:
echo   1. Clean up any stale processes
echo   2. Start Backend on port 4000
echo   3. Start Frontend on port 3010
echo   4. Open your browser automatically
echo   5. Monitor and auto-restart if needed
echo.
echo Press Ctrl+C to stop the servers
echo.
pause
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0auto-connect-server.ps1" -Monitor -NoBrowser

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Server startup failed!
    pause
)
