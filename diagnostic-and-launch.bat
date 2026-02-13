@echo off
color 0A
echo ==========================================
echo    AI Quiz - Connection Diagnostic Tool
echo ==========================================
echo.

:: Check server status
echo [1/5] Checking server status...
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 3 -UseBasicParsing; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% == 0 (
    echo     ? Server is RUNNING on port 3000
) else (
    echo     ? Server is NOT running
    echo.
    echo Starting server...
    start /min cmd /c "cd apps\frontend ^&^& npm run dev"
    timeout /t 15 /nobreak >nul
)

echo.
echo [2/5] Testing connection methods...
powershell -Command "$urls=@('http://127.0.0.1:3000','http://localhost:3000','http://192.168.1.65:3000'); foreach($u in $urls){try{$r=Invoke-WebRequest -Uri $u -TimeoutSec 3 -UseBasicParsing; Write-Host \"    ? $u - OK\" -ForegroundColor Green}catch{Write-Host \"    ? $u - Failed\" -ForegroundColor Red}}"

echo.
echo [3/5] Checking hosts file...
findstr /i "localhost" C:\Windows\System32\drivers\etc\hosts >nul
if %ERRORLEVEL% == 0 (
    echo     ? localhost entry found in hosts file
) else (
    echo     ??  No localhost entry in hosts file
    echo        This is normal on Windows 10+
)

echo.
echo [4/5] Checking firewall...
powershell -Command "Get-NetFirewallRule -DisplayName '*node*' -ErrorAction SilentlyContinue | Where-Object { $_.Enabled -eq 'True' } | Measure-Object | ForEach-Object { if($_.Count -gt 0) { Write-Host '    ? Node.js firewall rules found' } else { Write-Host '    ??  No Node.js firewall rules' } }"

echo.
echo [5/5] Opening browser...
echo     Launching: http://localhost:3000
echo.
echo ------------------------------------------
echo If browser shows error, TRY THESE URLs:
echo   1. http://127.0.0.1:3000
echo   2. http://192.168.1.65:3000
echo ------------------------------------------
echo.
start http://localhost:3000
pause
