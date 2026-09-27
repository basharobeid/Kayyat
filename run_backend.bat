@echo off
title Khayyat Backend (FastAPI + Python)
echo ==============================================
echo   Starting Khayyat Backend on http://localhost:8000
echo   API Base: http://localhost:8000/api/v1
echo   Docs:     http://localhost:8000/api/docs
echo ==============================================
cd /d "%~dp0backend"
if not exist ".env" copy ".env.example" ".env" >nul
".venv\Scripts\python.exe" -m alembic upgrade head
".venv\Scripts\python.exe" -m uvicorn app.main:app --reload
pause
