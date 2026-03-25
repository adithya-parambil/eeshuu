#!/bin/bash
# Generate secure secrets for production deployment
# Usage: ./scripts/generate-secrets.sh

set -e

echo "=== Generating Production Secrets ==="
echo ""

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo "❌ Error: openssl is required but not installed"
    exit 1
fi

echo "JWT_ACCESS_SECRET=$(openssl rand -hex 64)"
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)"
echo ""
echo "MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)"
echo ""

echo "=== Instructions ==="
echo "1. Copy the values above"
echo "2. Paste them into your .env file"
echo "3. Never commit .env to version control"
echo "4. Store secrets securely (AWS Secrets Manager, HashiCorp Vault, etc.)"
