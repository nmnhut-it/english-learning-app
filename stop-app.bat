@echo off
echo ========================================
echo Stopping English Learning Platform
echo ========================================
echo.

:: Kill processes on ports 10000 and 10001
echo Stopping frontend server (port 10000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :10000') do (
    taskkill /PID %%a /F 2>nul
)

echo Stopping backend server (port 10001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :10001') do (
    taskkill /PID %%a /F 2>nul
)

echo.
echo Servers stopped successfully!
echo.
pause
