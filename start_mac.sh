#!/bin/bash
echo "================================="
echo "   TallAI - AI Accounting App"
echo "================================="

echo "[1/2] Starting Backend..."
cd "$(dirname "$0")/backend"
uvicorn main:app --reload --port 8000 &
sleep 3

echo "[2/2] Starting Frontend..."
cd "../frontend"
npm run dev &
sleep 4

echo ""
echo "TallAI is running!"
echo "Backend API:  http://localhost:8000"
echo "Frontend App: http://localhost:5173"
echo "Login with: demo@tallai.com / demo123"
