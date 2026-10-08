@echo off
setlocal
cd /d %~dp0

where python >nul 2>nul
if errorlevel 1 (
  echo Python was not found. Install Python 3.11 or newer.
  pause
  exit /b 1
)

if not exist .venv (
  python -m venv .venv
)

call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt

start "" http://127.0.0.1:8000
python -m uvicorn app:app --host 0.0.0.0 --port 8000
