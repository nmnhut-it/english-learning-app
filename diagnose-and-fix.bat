@echo off
echo ========================================
echo English Learning App Diagnostic & Fix
echo ========================================
echo.

echo 1. Checking if backend is running...
netstat -an | findstr :3001 | findstr LISTENING > nul
if %errorlevel% equ 0 (
    echo    ✓ Port 3001 is listening
) else (
    echo    ✗ Backend is NOT running on port 3001
    goto FIX_BACKEND
)

echo.
echo 2. Testing backend API...
curl -s http://localhost:3001/api > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Backend API is responding
) else (
    echo    ✗ Backend API is not responding
    goto FIX_BACKEND
)

echo.
echo 3. Everything looks good!
echo    - Backend is running
echo    - API is responding
echo.
echo If you still see errors, try:
echo    - Clear browser cache (Ctrl+Shift+Delete)
echo    - Hard refresh (Ctrl+F5)
echo.
pause
exit /b 0

:FIX_BACKEND
echo.
echo ========================================
echo FIXING BACKEND...
echo ========================================
echo.

cd backend

echo Installing dependencies (including axios)...
call npm install axios
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Please check your internet connection
    pause
    exit /b 1
)

echo.
echo Starting backend server...
echo.
echo NOTE: Keep this window open!
echo The backend must run continuously.
echo.
npm run dev
