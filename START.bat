@echo off
echo ========================================
echo   AI QUIZ PLATFORM - STARTING SERVERS
echo ========================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0start-servers-robust.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to start servers!
    echo Check the error messages above.
    pause
    exit /b 1
)

echo.
pause
