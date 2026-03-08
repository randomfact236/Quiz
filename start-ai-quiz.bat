@echo off
REM ============================================================================
REM AI Quiz - Development Server Automation Script
REM ============================================================================
REM This script handles building and running both frontend and backend servers
REM 
REM Usage:
REM   start-ai-quiz.bat           - Start both frontend and backend
REM   start-ai-quiz.bat backend   - Start only backend
REM   start-ai-quiz.bat frontend   - Start only frontend
REM   start-ai-quiz.bat build     - Build both applications
REM   start-ai-quiz.bat test      - Run TypeScript checks
REM ============================================================================

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
cd /d "%PROJECT_ROOT%"

echo.
echo ========================================
echo   AI Quiz - Development Server
echo ========================================
echo.

if "%1"=="" goto start_both
if "%1"=="backend" goto start_backend
if "%1"=="frontend" goto start_frontend
if "%1"=="build" goto build_all
if "%1"=="test" goto run_tests
goto usage

:usage
echo Usage: start-ai-quiz.bat [option]
echo.
echo Options:
echo   (none)    - Start both frontend and backend
echo   backend    - Start only backend server
echo   frontend   - Start only frontend server  
echo   build      - Build both applications
echo   test       - Run TypeScript checks
echo.
echo Examples:
echo   start-ai-quiz.bat
echo   start-ai-quiz.bat backend
echo   start-ai-quiz.bat build
echo.
pause
goto :eof

:start_both
echo Starting both frontend and backend...
echo.
start "AI Quiz Backend" cmd /k "cd /d "%PROJECT_ROOT%apps\backend" && npm run start:dev"
timeout /t 3 /nobreak >nul
start "AI Quiz Frontend" cmd /k "cd /d "%PROJECT_ROOT%apps\frontend" && npm run dev"
echo.
echo Both servers starting!
echo - Backend: http://localhost:3012
echo - Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause
goto :eof

:start_backend
echo Starting backend server...
echo.
cd /d "%PROJECT_ROOT%apps\backend"
npm run start:dev
goto :eof

:start_frontend
echo Starting frontend server...
echo.
cd /d "%PROJECT_ROOT%apps\frontend"
npm run dev
goto :eof

:build_all
echo Building both applications...
echo.

echo [1/2] Building backend...
cd /d "%PROJECT_ROOT%apps\backend"
call npm run build
if errorlevel 1 (
    echo Backend build FAILED
    pause
    exit /b 1
)
echo Backend build SUCCESS
echo.

echo [2/2] Building frontend...
cd /d "%PROJECT_ROOT%apps\frontend"
call npm run build
if errorlevel 1 (
    echo Frontend build FAILED
    pause
    exit /b 1
)
echo Frontend build SUCCESS
echo.
echo ========================================
echo   Build Complete!
echo ========================================
echo.
pause
goto :eof

:run_tests
echo Running TypeScript checks...
echo.

echo [1/2] Checking backend...
cd /d "%PROJECT_ROOT%apps\backend"
call npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo Backend check FAILED
    pause
    exit /b 1
)
echo Backend check SUCCESS
echo.

echo [2/2] Checking frontend...
cd /d "%PROJECT_ROOT%apps\frontend"
call npx tsc --noEmit --skipLibCheck
if errorlevel 1 (
    echo Frontend check FAILED
    pause
    exit /b 1
)
echo Frontend check SUCCESS
echo.
echo ========================================
echo   All Checks Passed!
echo ========================================
echo.
pause
goto :eof
