#!/bin/sh
# Health check script for Docker containers
# Usage: ./scripts/docker-health-check.sh [service]

set -e

SERVICE=${1:-all}

check_service() {
    local name=$1
    local url=$2
    
    echo "Checking $name..."
    
    if curl -sf "$url" > /dev/null 2>&1; then
        echo "✅ $name is healthy"
        return 0
    else
        echo "❌ $name is unhealthy"
        return 1
    fi
}

case $SERVICE in
    backend)
        check_service "Backend (live)" "http://localhost/health/live"
        check_service "Backend (ready)" "http://localhost/health/ready"
        ;;
    frontend)
        check_service "Frontend" "http://localhost/"
        ;;
    all)
        echo "=== Health Check Report ==="
        echo ""
        
        check_service "Backend (live)" "http://localhost/health/live" || true
        check_service "Backend (ready)" "http://localhost/health/ready" || true
        check_service "Frontend" "http://localhost/" || true
        
        echo ""
        echo "=== Container Status ==="
        docker-compose ps
        ;;
    *)
        echo "Usage: $0 [backend|frontend|all]"
        exit 1
        ;;
esac
