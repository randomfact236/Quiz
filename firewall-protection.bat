@echo off
echo ========================================
echo AI QUIZ PLATFORM - FIREWALL PROTECTION
echo ========================================
echo.

:: Check if admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Administrator privileges required!
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Creating firewall rules to block external access...
echo.

:: Block external access to project ports
netsh advfirewall firewall add rule name="AIQuiz_Block_External_3010" dir=in action=block protocol=tcp localport=3010 remoteip=internet profile=any >nul 2>&1
if %errorLevel% == 0 (echo [OK] External access blocked for port 3010) else (echo [INFO] Rule for 3010 already exists)

netsh advfirewall firewall add rule name="AIQuiz_Block_External_4000" dir=in action=block protocol=tcp localport=4000 remoteip=internet profile=any >nul 2>&1
if %errorLevel% == 0 (echo [OK] External access blocked for port 4000) else (echo [INFO] Rule for 4000 already exists)

netsh advfirewall firewall add rule name="AIQuiz_Block_External_5432" dir=in action=block protocol=tcp localport=5432 remoteip=internet profile=any >nul 2>&1
if %errorLevel% == 0 (echo [OK] External access blocked for port 5432) else (echo [INFO] Rule for 5432 already exists)

netsh advfirewall firewall add rule name="AIQuiz_Block_External_6379" dir=in action=block protocol=tcp localport=6379 remoteip=internet profile=any >nul 2>&1
if %errorLevel% == 0 (echo [OK] External access blocked for port 6379) else (echo [INFO] Rule for 6379 already exists)

echo.
echo ========================================
echo ALLOWING LOCAL ACCESS
echo ========================================
echo.

:: Allow local access
netsh advfirewall firewall add rule name="AIQuiz_Allow_Local_3010" dir=in action=allow protocol=tcp localport=3010 remoteip=localsubnet profile=any >nul 2>&1
netsh advfirewall firewall add rule name="AIQuiz_Allow_Local_4000" dir=in action=allow protocol=tcp localport=4000 remoteip=localsubnet profile=any >nul 2>&1
netsh advfirewall firewall add rule name="AIQuiz_Allow_Local_5432" dir=in action=allow protocol=tcp localport=5432 remoteip=localsubnet profile=any >nul 2>&1
netsh advfirewall firewall add rule name="AIQuiz_Allow_Local_6379" dir=in action=allow protocol=tcp localport=6379 remoteip=localsubnet profile=any >nul 2>&1

echo [OK] Local access allowed for all ports
echo.
echo ========================================
echo PROTECTION COMPLETE
echo ========================================
echo.
echo Summary:
echo - Ports 3010, 4000, 5432, 6379 protected
echo - External/internet access: BLOCKED
echo - Local network access: ALLOWED
echo.
pause
