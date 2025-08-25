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

:: Kill any existing processes on our ports
echo Checking for existing processes on ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :10001') do (
    echo Killing existing process on port 10001...
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :10000') do (
    echo Killing existing process on port 10000...
    taskkill /PID %%a /F 2>nul
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
    :: Update dependencies in case new ones were added
    cd backend
    call npm install --silent
    cd ..
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
echo Starting all services...
echo ========================================
echo.

:: Start backend server (includes vocabulary tool)
echo Starting Backend Server (with Vocabulary Tool)...
start "English Learning Backend" cmd /k "cd /d backend && npm run dev"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start frontend server
echo Starting Frontend Server...
start "English Learning Frontend" cmd /k "cd /d frontend && npm run dev"

:: Wait for servers to fully start
timeout /t 5 /nobreak >nul

:: Display final information
echo.
echo ========================================
echo All services are running!
echo ========================================
echo.
echo === Main Services ===
echo Main Application: http://localhost:10000
echo Backend API: http://localhost:10001/api
echo.
echo === Translation System (NEW) ===
echo Translation Helper: http://localhost:10001/translation-helper
echo Teacher Dashboard: http://localhost:10001/teacher-dashboard
echo.
echo === Vocabulary Tools ===
echo Vocabulary Tool: http://localhost:10001/vocabulary
echo Vocabulary Quiz: http://localhost:10001/vocabulary-quiz
echo Vocabulary Quiz Enhanced: http://localhost:10001/vocabulary-quiz-enhanced
echo.
echo === Data Management ===
echo Formatted Data Viewer: http://localhost:10001/formatted-data-viewer
echo.
echo === File Storage ===
echo Vocabulary files: markdown-files\global-success-[grade]\vocabulary\
echo Translation database: translation-database\
echo.
echo To stop all servers:
echo   1. Run stop-app.bat, OR
echo   2. Close all command windows, OR
echo   3. Press Ctrl+C in each window
echo.
echo This window can be closed safely.
echo ========================================
pause
