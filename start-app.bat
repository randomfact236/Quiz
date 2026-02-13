@echo off
echo Starting AI Quiz App...
echo.
echo Current status:
echo ---------------

:: Check if server is running
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing; Write-Host 'Server Status: RUNNING (Port 3000)' -ForegroundColor Green } catch { Write-Host 'Server Status: NOT RUNNING' -ForegroundColor Red }"

echo.
echo Available URLs to try:
echo   1. http://localhost:3000
echo   2. http://127.0.0.1:3000
echo.

:: Open browser
echo Opening browser...
start http://localhost:3000

echo.
echo If the site doesn't load, try:
echo   - http://127.0.0.1:3000
echo   - Check Windows Firewall settings
echo   - Disable proxy if using one
echo.
pause
