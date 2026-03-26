#!/usr/bin/env pwsh
Write-Host "Stopping all containers..." -ForegroundColor Yellow
docker-compose down

Write-Host "Removing stopped containers..." -ForegroundColor Yellow
docker rm -f backend frontend nginx mongodb redis 2>$null

Write-Host "Starting fresh build..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host "Watching backend logs (Ctrl+C to stop)..." -ForegroundColor Green
docker-compose logs -f backend
