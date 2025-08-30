@echo off
echo ========================================
echo  📚 Starting V3 Markdown Viewer
echo  with Translation Integration
echo ========================================
echo.

cd /d "C:\Users\LAP14364-local\Documents\claude-workspace\english-learning-app\v3-viewer"

echo 🔧 Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

echo 🚀 Starting server...
echo.
echo Features:
echo  • Browse markdown lessons
echo  • Select text + Press T = Translate
echo  • Smart section detection
echo  • Collapsible translations
echo  • File history tracking
echo.
echo Server will start on: http://localhost:3005
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js