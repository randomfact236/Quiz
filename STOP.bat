@echo off
echo ========================================
echo   AI QUIZ PLATFORM - STOPPING SERVERS
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0stop-servers.ps1"

pause
