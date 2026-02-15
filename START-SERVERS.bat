@echo off
chcp 65001 >nul
title AI Quiz Platform - Server Manager
echo =========================================
echo   AI Quiz Platform - Server Manager
echo =========================================
echo.

:: Check if running as admin (optional but recommended)
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [Admin Mode] Running with administrator privileges
) else (
    echo [User Mode] Running without administrator privileges
)
echo.

:: Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0auto-start-servers.ps1" -OpenBrowser

echo.
echo Press any key to exit...
pause >nul
