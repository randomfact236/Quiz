@echo off
chcp 65001 >nul
title AI Quiz Server Status
echo.
echo 📊 AI Quiz Server Status
echo ════════════════════════════════════════
echo.

:: Check Backend
echo Checking Backend (port 4000)...
powershell -Command "$r=Test-NetConnection -ComputerName localhost -Port 4000 -WarningAction SilentlyContinue; if($r.TcpTestSucceeded){Write-Host '  ✅ Backend: RUNNING' -ForegroundColor Green}else{Write-Host '  ❌ Backend: STOPPED' -ForegroundColor Red}"
echo.

:: Check Frontend
echo Checking Frontend (port 3010)...
powershell -Command "$r=Test-NetConnection -ComputerName localhost -Port 3010 -WarningAction SilentlyContinue; if($r.TcpTestSucceeded){Write-Host '  ✅ Frontend: RUNNING' -ForegroundColor Green}else{Write-Host '  ❌ Frontend: STOPPED' -ForegroundColor Red}"
echo.
echo ════════════════════════════════════════
echo.

:: Show processes if running
powershell -Command "
$backendPid = Get-Content '%~dp0.backend.pid' -ErrorAction SilentlyContinue
$frontendPid = Get-Content '%~dp0.frontend.pid' -ErrorAction SilentlyContinue

if ($backendPid -and (Get-Process -Id $backendPid -ErrorAction SilentlyContinue)) {
    Write-Host 'Backend Process:' -ForegroundColor Cyan
    Write-Host \"  PID: $backendPid\" -ForegroundColor Gray
}
if ($frontendPid -and (Get-Process -Id $frontendPid -ErrorAction SilentlyContinue)) {
    Write-Host 'Frontend Process:' -ForegroundColor Cyan
    Write-Host \"  PID: $frontendPid\" -ForegroundColor Gray
}
"
echo.

:: Quick actions
echo Quick Actions:
echo   [1] Start Servers
echo   [2] Stop Servers
echo   [3] Restart Servers
echo   [4] Open in Browser
echo   [5] Exit
echo.
set /p choice="Select option (1-5): "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto BROWSER
if "%choice%"=="5" goto END

goto END

:START
call "%~dp0QUICK-START.bat"
goto END

:STOP
echo.
echo Stopping servers...
powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Remove-Item '%~dp0.backend.pid' -ErrorAction SilentlyContinue; Remove-Item '%~dp0.frontend.pid' -ErrorAction SilentlyContinue"
echo ✅ Servers stopped.
pause
goto END

:RESTART
call :STOP
timeout /t 2 /nobreak >nul
call :START
goto END

:BROWSER
start http://localhost:3010
goto END

:END
