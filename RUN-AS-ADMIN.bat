@echo off
:: AI Quiz Platform - Admin Port Setup Launcher
:: This file requests Administrator privileges

:: Check if already admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
    goto :run_setup
) else (
    echo Requesting Administrator privileges...
    goto :elevate
)

:elevate
:: Re-launch as admin
powershell -Command "Start-Process '%~f0' -Verb runAs"
exit /b

:run_setup
:: Now running as admin
cd /d "%~dp0"
echo.
echo ========================================
echo   AI QUIZ PLATFORM - PORT RESERVATION
echo ========================================
echo.
echo Reserving ports: 3010, 4000, 5432, 6379
echo.

:: Reserve ports
netsh int ip add excludedportrange protocol=tcp startport=3010 numberofports=1
if %errorLevel% == 0 (
    echo [OK] Port 3010 reserved
) else (
    echo [INFO] Port 3010 already reserved or error
)

netsh int ip add excludedportrange protocol=tcp startport=4000 numberofports=1
if %errorLevel% == 0 (
    echo [OK] Port 4000 reserved
) else (
    echo [INFO] Port 4000 already reserved or error
)

netsh int ip add excludedportrange protocol=tcp startport=5432 numberofports=1
if %errorLevel% == 0 (
    echo [OK] Port 5432 reserved
) else (
    echo [INFO] Port 5432 already reserved or error
)

netsh int ip add excludedportrange protocol=tcp startport=6379 numberofports=1
if %errorLevel% == 0 (
    echo [OK] Port 6379 reserved
) else (
    echo [INFO] Port 6379 already reserved or error
)

:: Create firewall rules
echo.
echo Creating firewall rules...
netsh advfirewall firewall add rule name="AIQuiz_Port_3010" dir=in action=allow protocol=tcp localport=3010 remoteip=localsubnet >nul 2>&1
netsh advfirewall firewall add rule name="AIQuiz_Port_4000" dir=in action=allow protocol=tcp localport=4000 remoteip=localsubnet >nul 2>&1
netsh advfirewall firewall add rule name="AIQuiz_Port_5432" dir=in action=allow protocol=tcp localport=5432 remoteip=localsubnet >nul 2>&1
netsh advfirewall firewall add rule name="AIQuiz_Port_6379" dir=in action=allow protocol=tcp localport=6379 remoteip=localsubnet >nul 2>&1
echo [OK] Firewall rules created

:: Show status
echo.
echo ========================================
echo   VERIFICATION
echo ========================================
netsh int ip show excludedportrange protocol=tcp | findstr "3010 4000 5432 6379"

echo.
echo ========================================
echo   SETUP COMPLETE
echo ========================================
echo.
echo Ports reserved: 3010, 4000, 5432, 6379
echo.
echo You can now run: npm run dev
echo.
pause
exit /b
