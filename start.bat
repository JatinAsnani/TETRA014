@echo off
title TallAI - Starting...
echo =================================
echo    TallAI - AI Accounting App
echo =================================
echo.

echo [1/2] Starting Backend (FastAPI)...
start cmd /k "title TallAI Backend && cd /d %~dp0backend && uvicorn main:app --reload --port 8000"

timeout /t 3

echo [2/2] Starting Frontend (React)...
start cmd /k "title TallAI Frontend && cd /d %~dp0frontend && npm run dev"

timeout /t 4

echo.
echo TallAI is running!
echo Backend API:  http://localhost:8000
echo Frontend App: http://localhost:5173
echo API Docs:     http://localhost:8000/docs
echo.
echo Login with: demo@tallai.com / demo123
pause
