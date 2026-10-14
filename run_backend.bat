@echo off
echo Starting AI-Powered Personal Health Copilot Backend...
cd /d "%~dp0backend"
if not exist "venv\Scripts\python.exe" (
    echo Creating virtual environment...
    python -m venv venv
    call .\venv\Scripts\activate
    pip install -r requirements.txt
)
call .\venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
