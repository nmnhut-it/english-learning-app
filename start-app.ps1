# English Learning Platform Starter Script
# PowerShell version with better process management

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting English Learning Platform" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get script directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Check directories
if (-not (Test-Path "backend")) {
    Write-Host "ERROR: backend directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "ERROR: frontend directory not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Function to check if port is in use
function Test-Port {
    param($Port)
    $connection = New-Object System.Net.Sockets.TcpClient
    try {
        $connection.Connect("0.0.0.0", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Check ports
Write-Host ""
Write-Host "Checking ports..." -ForegroundColor Yellow

if (Test-Port 3000) {
    Write-Host "WARNING: Port 3000 is already in use!" -ForegroundColor Red
    $continue = Read-Host "Continue anyway? (Y/N)"
    if ($continue -ne "Y") { exit 0 }
} else {
    Write-Host "Port 3000 is available" -ForegroundColor Green
}

if (Test-Port 3001) {
    Write-Host "WARNING: Port 3001 is already in use!" -ForegroundColor Red
    $continue = Read-Host "Continue anyway? (Y/N)"
    if ($continue -ne "Y") { exit 0 }
} else {
    Write-Host "Port 3001 is available" -ForegroundColor Green
}

# Install dependencies if needed
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
    Write-Host "Backend dependencies installed!" -ForegroundColor Green
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
    Write-Host "Frontend dependencies installed!" -ForegroundColor Green
}

# Start servers
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend
$backend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Write-Host 'Starting Backend Server...' -ForegroundColor Green; npm run dev" -PassThru

# Wait for backend to initialize
Start-Sleep -Seconds 3

# Start frontend
$frontend = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Write-Host 'Starting Frontend Server...' -ForegroundColor Green; npm run dev" -PassThru

# Display information
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Both servers are starting up..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend API: " -NoNewline
Write-Host "http://0.0.0.0:3001/api" -ForegroundColor Cyan
Write-Host "Frontend App: " -NoNewline
Write-Host "http://0.0.0.0:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "The application should open automatically in your browser."
Write-Host "If not, navigate to http://0.0.0.0:3000"
Write-Host ""
Write-Host "To stop the servers:" -ForegroundColor Yellow
Write-Host "1. Close both PowerShell windows, OR"
Write-Host "2. Press Ctrl+C in each window"
Write-Host ""

# Keep track of processes
Write-Host "Process IDs:" -ForegroundColor Yellow
Write-Host "Backend PID: $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host ""

# Optionally open browser after a delay
Start-Sleep -Seconds 5
Start-Process "http://0.0.0.0:3000"

Write-Host "Press any key to close this window (servers will continue running)..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
