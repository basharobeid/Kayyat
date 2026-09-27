@echo off
title Khayyat Frontend (Next.js)
echo ==============================================
echo   Starting Khayyat Frontend on http://localhost:3000
echo ==============================================
cd /d "%~dp0frontend"
"C:\Program Files\nodejs\npm.cmd" run dev
pause
