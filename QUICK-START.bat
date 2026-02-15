@echo off
chcp 65001 >nul
title AI Quiz Quick Start
echo.
echo 🚀 AI Quiz Platform - Quick Start
echo.

:: Check if servers are already running
powershell -Command "if (Test-NetConnection -ComputerName localhost -Port 3010 -WarningAction SilentlyContinue | Select-Object -ExpandProperty TcpTestSucceeded) { exit 0 } else { exit 1 }"

if %ERRORLEVEL% EQU 0 (
    echo ✅ Servers are already running!
    echo.
    echo Opening browser...
    start http://localhost:3010
    echo.
    echo Frontend: http://localhost:3010
    echo Backend:  http://localhost:4000
    echo.
    pause
    exit /b 0
)

echo Starting servers...
echo.

start "AI Quiz Servers" powershell -ExecutionPolicy Bypass -Command "& '%~dp0auto-connect-server.ps1' -NoBrowser"

echo Waiting for servers to be ready...
timeout /t 10 /nobreak >nul

:CHECK_LOOP
powershell -Command "if (Test-NetConnection -ComputerName localhost -Port 3010 -WarningAction SilentlyContinue | Select-Object -ExpandProperty TcpTestSucceeded) { exit 0 } else { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Servers are ready!
    echo.
    start http://localhost:3010
    echo Frontend: http://localhost:3010
    echo Backend:  http://localhost:4000
    echo.
    echo You can close this window. Servers will continue running.
    pause
    exit /b 0
)
echo Still waiting...
timeout /t 3 /nobreak >nul
goto CHECK_LOOP
