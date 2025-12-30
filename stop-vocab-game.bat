@echo off
chcp 65001 >nul
echo ========================================
echo  🛑 Stopping Vocabulary Game Servers
echo ========================================
echo.

:: Kill processes on port 8080 (Game)
echo Stopping Vocabulary Game (port 8080)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)

:: Kill processes on port 3005 (Markdown Viewer)
echo Stopping Markdown Viewer (port 3005)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3005 ^| findstr LISTENING') do (
    taskkill /PID %%a /F 2>nul
)

echo.
echo ✅ All servers stopped!
echo ========================================
timeout /t 2 /nobreak >nul
