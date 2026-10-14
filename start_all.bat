@echo off
echo ========================================================
echo Launching AI-Powered Personal Health Copilot...
echo ========================================================
echo.
echo 1. Starting Backend Server (FastAPI on http://127.0.0.1:8000)...
start "Health Copilot Backend" cmd /k "%~dp0run_backend.bat"

timeout /t 3 /nobreak >nul

echo 2. Starting Frontend App (Vite on http://localhost:5173)...
start "Health Copilot Frontend" cmd /k "%~dp0run_frontend.bat"

echo.
echo Application started! Open http://localhost:5173 in your browser.
echo ========================================================
