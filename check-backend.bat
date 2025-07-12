@echo off
echo Checking English Learning App Backend Status...
echo.

echo 1. Checking if backend is running on port 3001...
curl -s http://0.0.0.0:3001 > nul 2>&1
if %errorlevel% equ 0 (
    echo    ✓ Backend is responding
) else (
    echo    ✗ Backend is NOT responding
    echo.
    echo    Please make sure the backend is running:
    echo    - Check the backend console window
    echo    - Look for "Server running on port 3001"
)

echo.
echo 2. Testing API endpoints...

echo    Testing root endpoint...
curl -s http://0.0.0.0:3001/api
echo.

echo.
echo    Testing markdown files endpoint...
curl -s http://0.0.0.0:3001/api/markdown/files | findstr /C:"{" > nul
if %errorlevel% equ 0 (
    echo    ✓ Files API is working
    curl -s http://0.0.0.0:3001/api/markdown/files
) else (
    echo    ✗ Files API is not responding
)

echo.
echo.
echo 3. Common issues:
echo    - Make sure you ran: cd backend && npm install
echo    - Check for TypeScript errors in backend console
echo    - Ensure port 3001 is not blocked by firewall
echo.
pause
