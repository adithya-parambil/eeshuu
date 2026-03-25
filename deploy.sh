#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Quick Commerce — One-command AWS EC2 deploy script
# Usage: bash deploy.sh
# Run this on a fresh Ubuntu 22.04/24.04 EC2 instance.
# ─────────────────────────────────────────────────────────────────────────────
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERR]${NC}  $1"; exit 1; }

# ── 1. Install Docker if missing ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  sudo apt-get update -qq
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  success "Docker installed"
else
  success "Docker already installed: $(docker --version)"
fi

# ── 2. Install Docker Compose plugin if missing ───────────────────────────────
if ! docker compose version &>/dev/null; then
  info "Installing Docker Compose plugin..."
  sudo apt-get install -y -qq docker-compose-plugin
  success "Docker Compose installed"
else
  success "Docker Compose already installed: $(docker compose version)"
fi

# ── 3. Detect public IP ───────────────────────────────────────────────────────
PUBLIC_IP=$(curl -sf http://checkip.amazonaws.com || curl -sf http://ifconfig.me || echo "")
if [ -z "$PUBLIC_IP" ]; then
  warn "Could not auto-detect public IP. You will need to set it manually in .env"
  PUBLIC_IP="YOUR_EC2_PUBLIC_IP"
fi
info "Detected public IP: $PUBLIC_IP"

# ── 4. Generate secrets ───────────────────────────────────────────────────────
JWT_ACCESS=$(openssl rand -hex 64)
JWT_REFRESH=$(openssl rand -hex 64)
MONGO_PASS=$(openssl rand -hex 16)

# ── 5. Write .env ─────────────────────────────────────────────────────────────
if [ -f .env ]; then
  warn ".env already exists — skipping generation. Edit it manually if needed."
else
  info "Writing .env..."
  cat > .env <<EOF
# ── Server ────────────────────────────────────────────────────────────────────
PORT=5000
NODE_ENV=production

# ── MongoDB ───────────────────────────────────────────────────────────────────
DB_URI=mongodb://admin:${MONGO_PASS}@mongodb:27017/quickcommerce?authSource=admin
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY_MS=3000

# ── JWT ───────────────────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=${JWT_ACCESS}
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800

# ── Security ──────────────────────────────────────────────────────────────────
BCRYPT_ROUNDS=12

# ── CORS ──────────────────────────────────────────────────────────────────────
CLIENT_URL=http://${PUBLIC_IP}

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://redis:6379
REDIS_KEY_PREFIX=qc:

# ── Rate limiting ─────────────────────────────────────────────────────────────
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW=900000
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW=60000

# ── Observability ─────────────────────────────────────────────────────────────
LOG_LEVEL=info
METRICS_ENABLED=false

# ── Frontend ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=http://${PUBLIC_IP}/api
NEXT_PUBLIC_SOCKET_URL=http://${PUBLIC_IP}
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx

# ── MongoDB Docker credentials ────────────────────────────────────────────────
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_PASS}
EOF
  success ".env written"
fi

# ── 6. Build and start ────────────────────────────────────────────────────────
info "Building and starting all services (this takes ~3-5 min on first run)..."
docker compose down --remove-orphans 2>/dev/null || true
docker compose up --build -d

# ── 7. Wait for backend to be healthy ────────────────────────────────────────
info "Waiting for backend to be healthy..."
ATTEMPTS=0
until curl -sf http://localhost/health/live > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ $ATTEMPTS -ge 30 ]; then
    error "Backend did not become healthy after 90s. Run: docker compose logs backend"
  fi
  sleep 3
done
success "Backend is healthy"

# ── 8. Seed demo data ─────────────────────────────────────────────────────────
info "Seeding demo data..."
docker compose exec -T backend npm run seed 2>/dev/null \
  && success "Demo data seeded" \
  || warn "Seed skipped (data may already exist)"

# ── 9. Final status ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Quick Commerce is live! 🚀${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  App:     ${CYAN}http://${PUBLIC_IP}${NC}"
echo -e "  API:     ${CYAN}http://${PUBLIC_IP}/api/v1/products${NC}"
echo -e "  Health:  ${CYAN}http://${PUBLIC_IP}/health/live${NC}"
echo ""
echo -e "  Demo credentials:"
echo -e "    Customer:  customer@demo.com  / Demo@1234"
echo -e "    Delivery:  delivery@demo.com  / Demo@1234"
echo -e "    Admin:     admin@demo.com     / Demo@1234"
echo ""
echo -e "  Services:"
echo -e "    ✓ MongoDB (with persistent storage)"
echo -e "    ✓ Redis (Socket.io adapter enabled)"
echo -e "    ✓ Backend (Express + Socket.io)"
echo -e "    ✓ Frontend (Next.js)"
echo -e "    ✓ Nginx (reverse proxy)"
echo ""
echo -e "  Useful commands:"
echo -e "    docker compose ps              — container status"
echo -e "    docker compose logs -f         — all logs"
echo -e "    docker compose logs -f backend — backend logs"
echo -e "    docker compose down            — stop (keep data)"
echo -e "    docker compose down -v         — stop + wipe DB"
echo ""
