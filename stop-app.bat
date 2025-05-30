@echo off
echo ========================================
echo Stopping English Learning Platform
echo ========================================
echo.

:: Kill processes on ports 3000 and 3001
echo Stopping frontend server (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F 2>nul
)

echo Stopping backend server (port 3001)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F 2>nul
)

echo.
echo Servers stopped successfully!
echo.
pause
