@echo off
echo.
echo ============================================
echo AI Quiz Platform - ChunkLoadError Fix
echo ============================================
echo.

echo [Step 1] Stopping frontend container...
docker-compose stop frontend
docker-compose rm -f frontend

echo.
echo [Step 2] Clearing Next.js cache...
docker volume prune -f

echo.
echo [Step 3] Rebuilding frontend with Docker config...
cd apps\frontend
copy next.config.mjs next.config.mjs.backup
copy next.config.docker.js next.config.mjs
cd ..\..

echo.
echo [Step 4] Starting frontend...
docker-compose up -d frontend

echo.
echo [Step 5] Waiting for compilation...
timeout /t 30 /nobreak >nul

echo.
echo ============================================
echo Checking if frontend is working...
echo ============================================
curl -s -o nul -w "%%{http_code}" http://localhost:3010 > status.txt
set /p STATUS=<status.txt
del status.txt

if "%STATUS%"=="200" (
    echo.
    echo SUCCESS! Frontend is working!
    echo Open: http://localhost:3010
    echo.
    echo If you still see errors in browser:
    echo 1. Press Ctrl+F5 (hard refresh)
    echo 2. Or open in Incognito mode
    echo 3. Or clear browser cache (Ctrl+Shift+Delete)
) else (
    echo.
    echo Frontend returned status: %STATUS%
    echo Trying alternative fix...
    docker-compose restart frontend
    timeout /t 20 /nobreak >nul
    echo Please try opening http://localhost:3010 now
)

echo.
pause
