@echo off
echo ========================================
echo Starting English Learning Platform
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Display Node version
echo Node.js version:
node --version
echo.

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

:: Change to the script's directory
cd /d "%~dp0"

:: Check if backend directory exists
if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please ensure you're running this script from the project root directory
    pause
    exit /b 1
)

:: Check if frontend directory exists
if not exist "frontend" (
    echo ERROR: frontend directory not found!
    echo Please ensure you're running this script from the project root directory
    pause
    exit /b 1
)

:: Install dependencies if node_modules don't exist
echo Checking backend dependencies...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo Backend dependencies installed!
    echo.
) else (
    echo Backend dependencies already installed
    echo.
)

echo Checking frontend dependencies...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo Frontend dependencies installed!
    echo.
) else (
    echo Frontend dependencies already installed
    echo.
)

:: Start the servers
echo ========================================
echo Starting servers...
echo ========================================
echo.
echo Backend will run on: http://localhost:3001
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C in both windows to stop the servers
echo ========================================
echo.

:: Start backend server in a new window
start "English Learning Backend" cmd /k "cd /d backend && echo Starting Backend Server... && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start frontend server in a new window
start "English Learning Frontend" cmd /k "cd /d frontend && echo Starting Frontend Server... && npm run dev"

:: Keep this window open with instructions
echo.
echo ========================================
echo Both servers are starting up...
echo ========================================
echo.
echo Backend API: http://localhost:3001/api
echo Frontend App: http://localhost:3000
echo.
echo The application should open automatically in your browser.
echo If not, navigate to http://localhost:3000
echo.
echo To stop the servers:
echo 1. Close both command windows, OR
echo 2. Press Ctrl+C in each window
echo.
echo This window can be closed safely.
echo ========================================
pause
