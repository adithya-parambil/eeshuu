.PHONY: help build up down restart logs clean health backup secrets dev prod

# Default target
help:
	@echo "=== Docker Quick Commerce System ==="
	@echo ""
	@echo "Available commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs (all services)"
	@echo "  make clean      - Remove containers, networks, volumes"
	@echo "  make health     - Check health of all services"
	@echo "  make backup     - Backup MongoDB database"
	@echo "  make secrets    - Generate production secrets"
	@echo "  make dev        - Start in development mode"
	@echo "  make prod       - Start in production mode"
	@echo ""
	@echo "Service-specific logs:"
	@echo "  make logs-backend"
	@echo "  make logs-frontend"
	@echo "  make logs-nginx"
	@echo "  make logs-mongodb"

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d
	@echo ""
	@echo "✅ Services started"
	@echo "Access the application at: http://localhost"
	@echo ""
	@echo "Run 'make logs' to view logs"
	@echo "Run 'make health' to check service health"

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# View logs (all services)
logs:
	docker-compose logs -f

# View logs (specific services)
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-nginx:
	docker-compose logs -f nginx

logs-mongodb:
	docker-compose logs -f mongodb

# Clean up everything (⚠️ removes volumes)
clean:
	@echo "⚠️  This will remove all containers, networks, and volumes"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose down -v; \
		docker system prune -f; \
		echo "✅ Cleanup complete"; \
	fi

# Health check
health:
	@echo "=== Health Check ==="
	@echo ""
	@echo "Backend (live):"
	@curl -sf http://localhost/health/live | jq . || echo "❌ Failed"
	@echo ""
	@echo "Backend (ready):"
	@curl -sf http://localhost/health/ready | jq . || echo "❌ Failed"
	@echo ""
	@echo "Container status:"
	@docker-compose ps

# Backup MongoDB
backup:
	@bash scripts/backup-mongodb.sh

# Generate secrets
secrets:
	@bash scripts/generate-secrets.sh

# Development mode
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production mode
prod:
	@if [ ! -f .env ]; then \
		echo "❌ Error: .env file not found"; \
		echo "Copy .env.example to .env and configure it"; \
		exit 1; \
	fi
	docker-compose up -d
	@echo ""
	@echo "✅ Production services started"
	@make health

# Shell access
shell-backend:
	docker-compose exec backend sh

shell-frontend:
	docker-compose exec frontend sh

shell-mongodb:
	docker-compose exec mongodb mongosh -u $${MONGO_ROOT_USERNAME} -p $${MONGO_ROOT_PASSWORD}

# Stats
stats:
	docker stats

# Rebuild and restart a specific service
rebuild-backend:
	docker-compose up -d --build backend

rebuild-frontend:
	docker-compose up -d --build frontend
