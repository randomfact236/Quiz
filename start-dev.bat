@echo off
echo Starting AI Quiz Platform Development Environment...
echo.

echo Starting Backend (Port 4000)...
start "AI Quiz Backend" cmd /k "cd apps\backend && npm run start:dev"

echo Starting Frontend (Port 3010)...
start "AI Quiz Frontend" cmd /k "cd apps\frontend && npm run dev"

echo.
echo ===================================================
echo Environment Started!
echo Backend API: http://localhost:4000/api
echo Frontend: http://localhost:3010
echo Admin Panel: http://localhost:3010/admin
echo ===================================================
echo.
echo Please wait for both windows to show "Ready" or "Nest application successfully started".
pause
