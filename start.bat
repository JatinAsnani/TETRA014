@echo off
title FRIDAY - Starting...
echo ====================================================
echo    FRIDAY - AI Accounting & Risk Scanner
echo ====================================================
echo.

echo [1/2] Starting Backend (FastAPI)...
start cmd /k "title FRIDAY Backend && cd /d %~dp0backend && uvicorn main:app --reload --port 8000"

timeout /t 3

echo [2/2] Starting Frontend (React)...
start cmd /k "title FRIDAY Frontend && cd /d %~dp0frontend && npm run dev"

timeout /t 4

echo.
echo FRIDAY is running!
echo Backend API:  http://localhost:8000
echo Frontend App: http://localhost:5173
echo API Docs:     http://localhost:8000/docs
echo.
echo Register a new account or sign in with your credentials to get started.
pause
