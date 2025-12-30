@echo off
chcp 65001 >nul
echo ========================================
echo  🎮 Vocabulary Game + Markdown Viewer
echo ========================================
echo.

:: Change to script directory
cd /d "%~dp0"

:: Check if Python is available
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    where python3 >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo ⚠ Python not found, trying Node.js...
        goto :try_node
    ) else (
        set PYTHON_CMD=python3
        goto :start_servers
    )
) else (
    set PYTHON_CMD=python
    goto :start_servers
)

:try_node
where npx >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Neither Python nor Node.js found!
    echo Please install one of them:
    echo   - Python: https://python.org/
    echo   - Node.js: https://nodejs.org/
    pause
    exit /b 1
)
set USE_NODE=1
goto :start_servers

:start_servers
echo 🚀 Starting servers...
echo.

:: Kill existing processes on our ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3006 ^| findstr LISTENING') do (
    echo Stopping existing process on port 3006...
    taskkill /PID %%a /F 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    echo Stopping existing process on port 3005...
    taskkill /PID %%a /F 2>nul
)

timeout /t 1 /nobreak >nul

:: Start V2 Game Server
echo.
echo 📚 Starting Vocabulary Game (port 3006)...
if defined USE_NODE (
    start "Vocabulary Game" cmd /k "cd /d v2 && npx serve -l 3006"
) else (
    start "Vocabulary Game" cmd /k "cd /d v2 && %PYTHON_CMD% -m http.server 3006"
)

:: Wait for game server to start
timeout /t 2 /nobreak >nul

:: Start Markdown Viewer if v3-viewer exists
if exist "v3-viewer\server.js" (
    echo 📖 Starting Markdown Viewer (port 3005)...
    if not exist "v3-viewer\node_modules" (
        echo    Installing dependencies...
        cd v3-viewer
        call npm install
        cd ..
    )
    start "Markdown Viewer" cmd /k "cd /d v3-viewer && node server.js"
) else (
    echo ⚠ Markdown Viewer not found, skipping...
)

:: Wait and show info
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  ✅ All services started!
echo ========================================
echo.
echo  🎮 Vocabulary Game:
echo     http://localhost:3006
echo.
if exist "v3-viewer\server.js" (
    echo  📖 Markdown Viewer:
    echo     http://localhost:3005
    echo.
)
echo ----------------------------------------
echo  Keyboard Shortcuts (Game):
echo    1-5    : Select game mode
echo    L      : Change lesson
echo    SPACE  : Flip card / Replay audio
echo    ENTER  : Know
echo    BACKSPACE : Learn again
echo    ESC    : Back to menu
echo ----------------------------------------
echo.
echo  To stop: Close the command windows or
echo  run stop-vocab-game.bat
echo ========================================
echo.

:: Open browser
echo Opening browser...
start "" "http://localhost:3006"

echo.
echo This window can be closed safely.
pause
