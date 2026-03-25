#!/bin/bash
# ═════════════════════════════════════════════════════════════════════════════
# Quick Commerce — Complete EC2 Setup Script
# ═════════════════════════════════════════════════════════════════════════════
# Usage: 
#   curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/setup-ec2.sh | bash
#   OR after cloning: bash setup-ec2.sh
# ═════════════════════════════════════════════════════════════════════════════
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${CYAN}▶${NC} $1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warn()    { echo -e "${YELLOW}⚠${NC} $1"; }
error()   { echo -e "${RED}✗${NC} $1"; exit 1; }
header()  { echo -e "\n${BLUE}━━━ $1 ━━━${NC}"; }

header "Quick Commerce EC2 Setup"

# ── 1. System Update ──────────────────────────────────────────────────────────
info "Updating system packages..."
sudo apt-get update -qq
sudo apt-get upgrade -y -qq
success "System updated"

# ── 2. Install Docker ─────────────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Installing Docker..."
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
  success "Docker installed: $(docker --version)"
else
  success "Docker already installed: $(docker --version)"
fi

# ── 3. Install Docker Compose ────────────────────────────────────────────────
if ! docker compose version &>/dev/null; then
  info "Installing Docker Compose plugin..."
  sudo apt-get install -y -qq docker-compose-plugin
  success "Docker Compose installed"
else
  success "Docker Compose installed: $(docker compose version)"
fi

# ── 4. Install Git ────────────────────────────────────────────────────────────
if ! command -v git &>/dev/null; then
  info "Installing Git..."
  sudo apt-get install -y -qq git
  success "Git installed"
else
  success "Git already installed: $(git --version)"
fi

# ── 5. Detect Public IP ───────────────────────────────────────────────────────
info "Detecting public IP..."
PUBLIC_IP=$(curl -sf http://checkip.amazonaws.com || curl -sf http://ifconfig.me || echo "")
if [ -z "$PUBLIC_IP" ]; then
  warn "Could not auto-detect public IP"
  PUBLIC_IP="YOUR_EC2_PUBLIC_IP"
else
  success "Public IP: $PUBLIC_IP"
fi

# ── 6. Clone Repository (if not already in repo) ─────────────────────────────
if [ ! -f "docker-compose.yml" ]; then
  header "Repository Setup"
  read -p "Enter your Git repository URL: " REPO_URL
  if [ -z "$REPO_URL" ]; then
    error "Repository URL is required"
  fi
  
  info "Cloning repository..."
  git clone "$REPO_URL" app
  cd app
  success "Repository cloned"
else
  success "Already in repository directory"
fi

# ── 7. Generate Secrets ───────────────────────────────────────────────────────
header "Generating Secrets"
JWT_ACCESS=$(openssl rand -hex 64)
JWT_REFRESH=$(openssl rand -hex 64)
MONGO_PASS=$(openssl rand -hex 16)
success "Secrets generated"

# ── 8. Create .env File ───────────────────────────────────────────────────────
if [ -f .env ]; then
  warn ".env already exists — backing up to .env.backup"
  cp .env .env.backup
fi

info "Creating .env file..."
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
NEXT_PUBLIC_OPENCAGE_API_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# ── MongoDB Docker credentials ────────────────────────────────────────────────
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=${MONGO_PASS}
EOF
success ".env created"

# ── 9. Build and Start Services ──────────────────────────────────────────────
header "Building and Starting Services"
info "This will take 3-5 minutes on first run..."

# Stop any existing containers
docker compose down --remove-orphans 2>/dev/null || true

# Build and start
docker compose up --build -d

success "Services started"

# ── 10. Wait for Services to be Healthy ──────────────────────────────────────
header "Health Checks"

info "Waiting for MongoDB..."
ATTEMPTS=0
until docker compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" --quiet &>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ $ATTEMPTS -ge 20 ]; then
    error "MongoDB failed to start. Check logs: docker compose logs mongodb"
  fi
  sleep 2
done
success "MongoDB is healthy"

info "Waiting for Redis..."
ATTEMPTS=0
until docker compose exec -T redis redis-cli ping &>/dev/null; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ $ATTEMPTS -ge 20 ]; then
    error "Redis failed to start. Check logs: docker compose logs redis"
  fi
  sleep 2
done
success "Redis is healthy"

info "Waiting for Backend..."
ATTEMPTS=0
until curl -sf http://localhost/health/live > /dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ $ATTEMPTS -ge 40 ]; then
    error "Backend failed to start. Check logs: docker compose logs backend"
  fi
  sleep 3
done
success "Backend is healthy"

# ── 11. Seed Demo Data ────────────────────────────────────────────────────────
header "Seeding Demo Data"
info "Creating demo users and products..."
if docker compose exec -T backend npm run seed 2>/dev/null; then
  success "Demo data seeded"
else
  warn "Seed skipped (data may already exist or seed script not found)"
fi

# ── 12. Configure Firewall (UFW) ──────────────────────────────────────────────
header "Firewall Configuration"
if command -v ufw &>/dev/null; then
  info "Configuring UFW firewall..."
  sudo ufw --force enable
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS
  success "Firewall configured"
else
  warn "UFW not installed — ensure AWS Security Group allows ports 22, 80, 443"
fi

# ── 13. Setup Auto-restart on Reboot ─────────────────────────────────────────
header "Auto-restart Configuration"
info "Enabling Docker to start on boot..."
sudo systemctl enable docker
success "Docker will start on system boot"

# ── 14. Final Status ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    🚀 DEPLOYMENT COMPLETE! 🚀                  ${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${CYAN}Application URL:${NC}  http://${PUBLIC_IP}"
echo -e "  ${CYAN}API Health:${NC}       http://${PUBLIC_IP}/health/live"
echo -e "  ${CYAN}API Endpoint:${NC}     http://${PUBLIC_IP}/api/v1/products"
echo ""
echo -e "${YELLOW}Demo Credentials:${NC}"
echo -e "  Customer:  customer@demo.com  / Demo@1234"
echo -e "  Delivery:  delivery@demo.com  / Demo@1234"
echo -e "  Admin:     admin@demo.com     / Demo@1234"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  docker compose ps              ${CYAN}# View container status${NC}"
echo -e "  docker compose logs -f         ${CYAN}# View all logs${NC}"
echo -e "  docker compose logs -f backend ${CYAN}# View backend logs${NC}"
echo -e "  docker compose restart         ${CYAN}# Restart all services${NC}"
echo -e "  docker compose down            ${CYAN}# Stop (keep data)${NC}"
echo -e "  docker compose down -v         ${CYAN}# Stop + wipe all data${NC}"
echo ""
echo -e "${YELLOW}Services Running:${NC}"
docker compose ps
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
