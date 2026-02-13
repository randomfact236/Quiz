@echo off
chcp 65001 >nul
echo 🛠️  Auto-Fix Errors for Quiz App
echo ================================

if "%~1"=="" (
    echo Usage: auto-fix-errors.bat [frontend^|backend^|all]
    echo.
    echo Options:
    echo   frontend  - Fix frontend only
    echo   backend   - Fix backend only
    echo   all       - Fix both (default)
    echo.
    set TARGET=all
) else (
    set TARGET=%~1
)

echo.
echo Target: %TARGET%
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0auto-fix-errors.ps1" -%TARGET%

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Some errors could not be fixed automatically.
    echo Please check the output above.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ All checks passed!
    echo.
    echo Please restart your dev servers:
    echo   1. Frontend: cd apps/frontend ^&^& npm run dev
    echo   2. Backend:  cd apps/backend ^&^& npm run start:dev
    pause
    exit /b 0
)
