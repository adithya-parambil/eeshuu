#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# SSL Deployment Script for eeshuu.qzz.io
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔐 SSL Deployment Script"
echo "========================"
echo ""

# Configuration
EC2_IP="3.110.105.75"
EC2_USER="ubuntu"
PEM_FILE="C:/Users/jayakumar/Downloads/eeshuu-key.pem"
SSL_ZIP="C:/Users/jayakumar/Downloads/eeshuu.qzz.io (1).zip"
PROJECT_DIR="~/eeshuu"

# Step 1: Extract SSL certificates locally
echo "📦 Step 1: Extracting SSL certificates..."
TEMP_DIR=$(mktemp -d)
unzip -q "$SSL_ZIP" -d "$TEMP_DIR"
echo "✅ Certificates extracted to: $TEMP_DIR"
echo ""

# Step 2: Upload SSL certificates to EC2
echo "🚀 Step 2: Uploading SSL certificates to EC2..."
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_IP" "mkdir -p $PROJECT_DIR/nginx/ssl"

# Upload certificate files
scp -i "$PEM_FILE" "$TEMP_DIR/certificate.crt" "$EC2_USER@$EC2_IP:$PROJECT_DIR/nginx/ssl/"
scp -i "$PEM_FILE" "$TEMP_DIR/private.key" "$EC2_USER@$EC2_IP:$PROJECT_DIR/nginx/ssl/"
scp -i "$PEM_FILE" "$TEMP_DIR/ca_bundle.crt" "$EC2_USER@$EC2_IP:$PROJECT_DIR/nginx/ssl/"

echo "✅ SSL certificates uploaded"
echo ""

# Step 3: Set proper permissions
echo "🔒 Step 3: Setting certificate permissions..."
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd ~/eeshuu
chmod 600 nginx/ssl/private.key
chmod 644 nginx/ssl/certificate.crt
chmod 644 nginx/ssl/ca_bundle.crt
ENDSSH
echo "✅ Permissions set"
echo ""

# Step 4: Pull latest code and update .env
echo "📥 Step 4: Pulling latest code..."
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd ~/eeshuu
git pull origin main

# Update .env with HTTPS URLs and increased rate limits
cat > .env << 'EOF'
# ─── MongoDB auth (docker-compose mongodb service) ───────────────────────────
MONGO_ROOT_USERNAME=root
MONGO_ROOT_PASSWORD=root

# ─── Backend (passed to backend container in docker-compose) ─────────────────
PORT=5000
NODE_ENV=production
DB_URI=mongodb://root:root@mongodb:27017/eeshuu?authSource=admin
DB_RETRY_ATTEMPTS=5
DB_RETRY_DELAY_MS=3000
JWT_ACCESS_SECRET=eeshuu_demo_access_secret_key_minimum_64_characters_required_for_production_security_12345678901234567890
JWT_REFRESH_SECRET=eeshuu_demo_refresh_secret_key_minimum_64_characters_required_for_production_security_09876543210987654321
JWT_ACCESS_TTL_SECONDS=900
JWT_REFRESH_TTL_SECONDS=604800
BCRYPT_ROUNDS=10
CLIENT_URL=https://eeshuu.qzz.io
REDIS_URL=redis://redis:6379
REDIS_KEY_PREFIX=eeshuu:
RATE_LIMIT_AUTH_MAX=50
RATE_LIMIT_AUTH_WINDOW=900000
RATE_LIMIT_GENERAL_MAX=500
RATE_LIMIT_GENERAL_WINDOW=60000
LOG_LEVEL=info
METRICS_ENABLED=false
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=placeholder_secret

# ─── Frontend ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://eeshuu.qzz.io/api
NEXT_PUBLIC_SOCKET_URL=https://eeshuu.qzz.io
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
NEXT_PUBLIC_OPENCAGE_API_KEY=d788dd3457394226b6e04cdca755da01
EOF
ENDSSH
echo "✅ Code updated and .env configured with HTTPS"
echo ""

# Step 5: Rebuild and restart services
echo "🔨 Step 5: Rebuilding services with SSL..."
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd ~/eeshuu
docker compose down
docker compose up --build -d
ENDSSH
echo "✅ Services rebuilt with SSL"
echo ""

# Step 6: Wait for services to be healthy
echo "⏳ Step 6: Waiting for services to be healthy (30 seconds)..."
sleep 30

# Step 7: Verify deployment
echo "🔍 Step 7: Verifying deployment..."
ssh -i "$PEM_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd ~/eeshuu
echo "Container status:"
docker compose ps
echo ""
echo "SSL certificate check:"
ls -lh nginx/ssl/
ENDSSH

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "✅ SSL Deployment Complete!"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Your application is now available at:"
echo "   https://eeshuu.qzz.io"
echo ""
echo "📝 Next steps:"
echo "   1. Visit https://eeshuu.qzz.io to verify SSL is working"
echo "   2. Test login with: customer@demo.com / Demo@1234"
echo "   3. Enable Cloudflare proxy (orange cloud) for DDoS protection"
echo ""
