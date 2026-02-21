#!/bin/bash
# ============================================
# Prava Online - Deploy Script
# Run on server: bash /opt/prava/deploy.sh
# ============================================

set -e

REPO_DIR="/opt/prava"
FRONTEND_USER_DIR="/var/www/pravaonline.uz"
FRONTEND_ADMIN_DIR="/var/www/admin"
BACKEND_DIR="$REPO_DIR/backend"

echo "=== Prava Online Deploy ==="

# 1. Pull latest from GitHub
echo "[1/4] Pulling latest code from GitHub..."
cd "$REPO_DIR"
git pull origin main

# 2. Build and deploy backend (Docker)
echo "[2/4] Building and deploying backend..."
cd "$BACKEND_DIR"
if [ -f .env ]; then
    echo "  .env file found"
else
    echo "  WARNING: .env file not found! Copy from old deployment:"
    echo "  cp /opt/prava-online/.env $BACKEND_DIR/.env"
fi
docker compose down
docker compose up -d --build
echo "  Waiting for health check..."
sleep 10
docker compose ps

# 3. Build and deploy frontend (requires Node.js)
echo "[3/4] Building frontend..."
if command -v node &> /dev/null; then
    # Build prava-test (user app)
    cd "$REPO_DIR/frontend/prava-test"
    yarn install --frozen-lockfile 2>/dev/null || npm install
    npx vite build
    cp -r dist/* "$FRONTEND_USER_DIR/"
    echo "  prava-test deployed to $FRONTEND_USER_DIR"

    # Build prava-admin
    cd "$REPO_DIR/frontend/prava-admin"
    yarn install --frozen-lockfile 2>/dev/null || npm install
    npx vite build
    cp -r dist/* "$FRONTEND_ADMIN_DIR/"
    echo "  prava-admin deployed to $FRONTEND_ADMIN_DIR"
else
    echo "  SKIP: Node.js not installed. Install with:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
    echo "  apt-get install -y nodejs"
    echo "  npm install -g yarn"
fi

# 4. Reload Nginx
echo "[4/4] Reloading Nginx..."
systemctl reload nginx

echo ""
echo "=== Deploy complete! ==="
echo "Check: https://pravaonline.uz"
echo "Admin: https://admin.pravaonline.uz"
