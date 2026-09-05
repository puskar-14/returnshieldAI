#!/usr/bin/env pwsh
# ReturnShield AI — One-Click Startup Script
# Run this script from the ShieldApp directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ReturnShield AI — Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "backend"
$FrontendDir = Join-Path $RootDir "frontend"

# Check prerequisites
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Python not found. Please install Python 3.11+" -ForegroundColor Red
    exit 1
}
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

# Install backend deps if needed
Write-Host "[1/5] Checking backend dependencies..." -ForegroundColor Yellow
Push-Location $BackendDir
if (-not (Test-Path "app\ml\model_artifacts\model.joblib")) {
    Write-Host "[2/5] Generating dataset and training model (first run only)..." -ForegroundColor Yellow
    python data/generate_dataset.py
    python data/train_model.py
} else {
    Write-Host "[2/5] ML model already trained. Skipping." -ForegroundColor Green
}
Pop-Location

# Install frontend deps if needed
Write-Host "[3/5] Checking frontend dependencies..." -ForegroundColor Yellow
Push-Location $FrontendDir
if (-not (Test-Path "node_modules")) {
    Write-Host "      Installing npm packages..." -ForegroundColor Yellow
    npm install
}
Pop-Location

Write-Host ""
Write-Host "[4/5] Starting Backend (FastAPI)..." -ForegroundColor Yellow
$backendProcess = Start-Process -FilePath "python" `
    -ArgumentList "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" `
    -WorkingDirectory $BackendDir `
    -PassThru

Write-Host "[5/5] Starting Frontend (Vite)..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory $FrontendDir `
    -PassThru

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ReturnShield AI is starting..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Login:  merchant@demo.com / demo123" -ForegroundColor White
Write-Host ""
Write-Host "  Press Ctrl+C to stop all services." -ForegroundColor Gray
Write-Host ""

# Wait for Ctrl+C
try {
    Wait-Process -Id $backendProcess.Id, $frontendProcess.Id
} catch {
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Services stopped." -ForegroundColor Gray
}
