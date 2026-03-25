#!/bin/bash

# Eeshuu Development Startup Script
# This script starts both backend and frontend in development mode

echo "🚀 Starting Eeshuu Development Environment..."
echo ""

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
fi

# Check if backend .env.development exists
if [ ! -f "backend/.env.development" ]; then
  echo "⚠️  Warning: backend/.env.development not found!"
  echo "   Please create it with your MongoDB connection string."
  exit 1
fi

# Check if frontend .env.local exists
if [ ! -f ".env.local" ]; then
  echo "⚠️  Warning: .env.local not found!"
  echo "   Please create it with NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL."
  exit 1
fi

echo ""
echo "✅ All dependencies installed"
echo ""
echo "🌱 Seeding database with demo data..."
cd backend && npm run seed
SEED_EXIT_CODE=$?
cd ..

if [ $SEED_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "⚠️  Database seeding failed. Please check your MongoDB connection."
  echo "   You can still start the servers, but you'll need to seed manually."
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "🎉 Starting servers..."
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Demo Credentials:"
echo "  customer@demo.com / Demo@1234"
echo "  delivery@demo.com / Demo@1234"
echo "  admin@demo.com    / Demo@1234"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in foreground
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
