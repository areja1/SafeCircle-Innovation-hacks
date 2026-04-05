@echo off
echo Starting SafeCircle...
start "Backend" cmd /k "cd backend && python -m uvicorn main:app --reload"
start "Frontend" cmd /k "cd frontend && npm run dev"
