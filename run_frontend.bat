@echo off
echo Starting AI-Powered Personal Health Copilot Frontend...
cd /d "%~dp0frontend"
if not exist "node_modules" (
    echo Installing npm dependencies...
    npm install
)
npm run dev
pause
