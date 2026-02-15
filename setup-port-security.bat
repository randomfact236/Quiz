@echo off
chcp 65001 >nul
title AI Quiz - Port Security Setup

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator privileges required!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo ========================================
echo   AI QUIZ PLATFORM - PORT SECURITY
echo ========================================
echo.
echo This will:
echo  1. Reserve ports 3010, 4000, 5432, 6379 in Windows
echo  2. Create firewall rules to protect these ports
echo  3. Block external access to project ports
echo.
echo Press any key to continue or CTRL+C to cancel...
pause >nul

echo.
echo [1/3] Reserving ports in Windows...
powershell -ExecutionPolicy Bypass -File "%~dp0port-security-enforcer.ps1" -Action setup

echo.
echo [2/3] Validating port configuration...
powershell -ExecutionPolicy Bypass -File "%~dp0server-manager.ps1" -Action validate

echo.
echo [3/3] Creating persistent port protection...
:: Create a scheduled task to re-apply port reservations on boot
schtasks /query /tn "AIQuiz_PortProtection" >nul 2>&1
if %errorLevel% neq 0 (
    schtasks /create /tn "AIQuiz_PortProtection" /tr "powershell -ExecutionPolicy Bypass -File '%~dp0port-security-enforcer.ps1' -Action enforce" /sc onstart /ru SYSTEM /f >nul 2>&1
    echo Port protection scheduled task created.
) else (
    echo Port protection scheduled task already exists.
)

echo.
echo ========================================
echo   PORT SECURITY SETUP COMPLETE
echo ========================================
echo.
echo Reserved Ports:
echo   - Frontend:  3010
echo   - Backend:   4000
echo   - PostgreSQL: 5432
echo   - Redis:     6379
echo.
echo These ports are now:
echo   [x] Reserved in Windows (other apps cannot use them)
echo   [x] Protected by firewall rules
echo   [x] Blocked from external access
echo.
echo To release ports, run: port-security-enforcer.ps1 -Action release
echo.
pause
