#!/bin/bash
# ============================================
# Prava Online - Auto Deploy Script
# Polls GitHub every 10 minutes via cron.
# Only deploys when new commits are detected.
#
# Cron entry:
#   */10 * * * * /opt/prava/auto-deploy.sh >> /var/log/prava-deploy.log 2>&1
# ============================================

set -euo pipefail

# --- Configuration ---
REPO_DIR="/opt/prava"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_USER_SRC="$REPO_DIR/frontend/prava-test"
FRONTEND_ADMIN_SRC="$REPO_DIR/frontend/prava-admin"
FRONTEND_USER_DIR="/var/www/pravaonline.uz"
FRONTEND_ADMIN_DIR="/var/www/admin"
BRANCH="main"
LOCKFILE="/tmp/prava-deploy.lock"
HEALTH_URL="http://localhost:8080/actuator/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=5

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

cleanup() {
    rm -f "$LOCKFILE"
}

# --- Prevent concurrent runs ---
if [ -f "$LOCKFILE" ]; then
    LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || true)
    if [ -n "$LOCK_PID" ] && kill -0 "$LOCK_PID" 2>/dev/null; then
        log "SKIP: Another deploy is running (PID $LOCK_PID)"
        exit 0
    else
        log "WARN: Stale lockfile found, removing"
        rm -f "$LOCKFILE"
    fi
fi
echo $$ > "$LOCKFILE"
trap cleanup EXIT

# --- Check for new commits ---
cd "$REPO_DIR"
log "Fetching from origin/$BRANCH..."
git fetch origin "$BRANCH" 2>&1

LOCAL_HEAD=$(git rev-parse HEAD)
REMOTE_HEAD=$(git rev-parse "origin/$BRANCH")

if [ "$LOCAL_HEAD" = "$REMOTE_HEAD" ]; then
    log "No changes detected (HEAD: ${LOCAL_HEAD:0:8}). Skipping deploy."
    exit 0
fi

log "=========================================="
log "NEW COMMITS DETECTED!"
log "  Local:  ${LOCAL_HEAD:0:8}"
log "  Remote: ${REMOTE_HEAD:0:8}"
log "=========================================="

# Show what changed
log "Changes:"
git log --oneline "$LOCAL_HEAD".."$REMOTE_HEAD" 2>&1

# --- Pull latest code ---
log "[1/6] Pulling latest code..."
git pull origin "$BRANCH" 2>&1

# --- Detect what changed ---
CHANGED_FILES=$(git diff --name-only "$LOCAL_HEAD" "$REMOTE_HEAD")
BACKEND_CHANGED=false
FRONTEND_USER_CHANGED=false
FRONTEND_ADMIN_CHANGED=false

if echo "$CHANGED_FILES" | grep -q "^backend/"; then
    BACKEND_CHANGED=true
fi
if echo "$CHANGED_FILES" | grep -q "^frontend/prava-test/"; then
    FRONTEND_USER_CHANGED=true
fi
if echo "$CHANGED_FILES" | grep -q "^frontend/prava-admin/"; then
    FRONTEND_ADMIN_CHANGED=true
fi

log "  Backend changed: $BACKEND_CHANGED"
log "  Frontend (user) changed: $FRONTEND_USER_CHANGED"
log "  Frontend (admin) changed: $FRONTEND_ADMIN_CHANGED"

# --- Backend deploy ---
if [ "$BACKEND_CHANGED" = true ]; then
    log "[2/6] Building and deploying backend..."
    cd "$BACKEND_DIR"
    docker compose up -d --build 2>&1
    log "  Backend containers started. Waiting for health check..."

    # Health check with retries
    HEALTHY=false
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        sleep $HEALTH_RETRY_INTERVAL
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            HEALTHY=true
            log "  Backend healthy after $((i * HEALTH_RETRY_INTERVAL))s"
            break
        fi
        log "  Health check attempt $i/$MAX_HEALTH_RETRIES - HTTP $HTTP_CODE"
    done

    if [ "$HEALTHY" = false ]; then
        log "ERROR: Backend health check failed after $((MAX_HEALTH_RETRIES * HEALTH_RETRY_INTERVAL))s!"
        log "  Docker status:"
        docker compose ps 2>&1
        log "  Recent logs:"
        docker compose logs --tail=20 app 2>&1
        exit 1
    fi
else
    log "[2/6] Backend unchanged, skipping build."
fi

# --- Frontend (user) deploy ---
if [ "$FRONTEND_USER_CHANGED" = true ]; then
    log "[3/6] Building frontend (prava-test)..."
    cd "$FRONTEND_USER_SRC"
    yarn install --frozen-lockfile 2>&1
    npx vite build 2>&1
    rm -rf "${FRONTEND_USER_DIR:?}"/*
    cp -r dist/* "$FRONTEND_USER_DIR/"
    log "  prava-test deployed to $FRONTEND_USER_DIR"
else
    log "[3/6] Frontend (user) unchanged, skipping build."
fi

# --- Frontend (admin) deploy ---
if [ "$FRONTEND_ADMIN_CHANGED" = true ]; then
    log "[4/6] Building frontend (prava-admin)..."
    cd "$FRONTEND_ADMIN_SRC"
    yarn install --frozen-lockfile 2>&1
    npx vite build 2>&1
    rm -rf "${FRONTEND_ADMIN_DIR:?}"/*
    cp -r dist/* "$FRONTEND_ADMIN_DIR/"
    log "  prava-admin deployed to $FRONTEND_ADMIN_DIR"
else
    log "[4/6] Frontend (admin) unchanged, skipping build."
fi

# --- Reload Nginx ---
if [ "$FRONTEND_USER_CHANGED" = true ] || [ "$FRONTEND_ADMIN_CHANGED" = true ]; then
    log "[5/6] Reloading Nginx..."
    systemctl reload nginx 2>&1
else
    log "[5/6] No frontend changes, skipping Nginx reload."
fi

# --- Docker cleanup ---
log "[6/6] Cleaning up Docker resources..."
docker image prune -f 2>&1
docker builder prune -f --filter "until=24h" 2>&1 || true

# --- Summary ---
log "=========================================="
log "DEPLOY COMPLETE!"
log "  Commit: $(git rev-parse --short HEAD)"
log "  Backend: $BACKEND_CHANGED"
log "  User frontend: $FRONTEND_USER_CHANGED"
log "  Admin frontend: $FRONTEND_ADMIN_CHANGED"
log "=========================================="
