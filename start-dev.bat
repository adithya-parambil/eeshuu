@echo off
REM Eeshuu Development Startup Script (Windows)
REM This script starts both backend and frontend in development mode

echo.
echo 🚀 Starting Eeshuu Development Environment...
echo.

REM Check if backend dependencies are installed
if not exist "backend\node_modules" (
  echo 📦 Installing backend dependencies...
  cd backend
  call npm install
  cd ..
)

REM Check if frontend dependencies are installed
if not exist "node_modules" (
  echo 📦 Installing frontend dependencies...
  call npm install
)

REM Check if backend .env.development exists
if not exist "backend\.env.development" (
  echo ⚠️  Warning: backend\.env.development not found!
  echo    Please create it with your MongoDB connection string.
  pause
  exit /b 1
)

REM Check if frontend .env.local exists
if not exist ".env.local" (
  echo ⚠️  Warning: .env.local not found!
  echo    Please create it with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL.
  pause
  exit /b 1
)

echo.
echo ✅ All dependencies installed
echo.
echo 🌱 Seeding database with demo data...
cd backend
call npm run seed
set SEED_EXIT_CODE=%ERRORLEVEL%
cd ..

if %SEED_EXIT_CODE% neq 0 (
  echo.
  echo ⚠️  Database seeding failed. Please check your MongoDB connection.
  echo    You can still start the servers, but you'll need to seed manually.
  echo.
  set /p CONTINUE="Continue anyway? (y/n): "
  if /i not "%CONTINUE%"=="y" exit /b 1
)

echo.
echo 🎉 Starting servers...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Demo Credentials:
echo   customer@demo.com / Demo@1234
echo   delivery@demo.com / Demo@1234
echo   admin@demo.com    / Demo@1234
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start backend in new window
start "Eeshuu Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
start "Eeshuu Frontend" cmd /k "npm run dev"

echo.
echo ✅ Servers started in separate windows
echo.
pause
