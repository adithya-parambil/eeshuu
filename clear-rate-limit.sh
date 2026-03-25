#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════════════════════
# Clear Rate Limit Script
# ═══════════════════════════════════════════════════════════════════════════════

echo "🔄 Clearing rate limit and restarting backend..."
echo ""

# Configuration
EC2_IP="3.110.105.75"
EC2_USER="ubuntu"
PEM_FILE="C:/Users/jayakumar/Downloads/eeshuu-key.pem"

ssh -i "$PEM_FILE" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd ~/eeshuu

# Clear Redis rate limit data
echo "🗑️  Clearing Redis rate limit data..."
docker compose exec -T redis redis-cli FLUSHDB

# Restart backend with new rate limits
echo "🔄 Restarting backend..."
docker compose restart backend

echo "✅ Done! Rate limits cleared and backend restarted."
ENDSSH

echo ""
echo "✅ Rate limit cleared! You can now access the site again."
echo "🌐 Visit: https://eeshuu.qzz.io"
