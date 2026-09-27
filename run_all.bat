@echo off
title Khayyat Fullstack Launcher (FastAPI + React)
echo =======================================================
echo   Launching Khayyat Fullstack
echo   Backend:  http://localhost:8000/api/v1 (FastAPI)
echo   Frontend: http://localhost:3000        (Next.js React)
echo =======================================================
start "Khayyat Backend (FastAPI)" cmd /k "%~dp0run_backend.bat"
start "Khayyat Frontend (React)" cmd /k "%~dp0run_frontend.bat"
echo Both servers launched in separate windows!
