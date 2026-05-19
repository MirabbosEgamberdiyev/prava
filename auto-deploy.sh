#!/bin/bash
# ============================================
# Prava Online - Auto Deploy Script
# Polls GitHub every 10 minutes via cron.
# Only deploys when new commits are detected.
#
# Cron entry:
#   */10 * * * * /opt/prava/auto-deploy.sh >> /var/log/prava-deploy.log 2>&1
# ============================================

set -eo pipefail

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
# Docker Maven build can take 10-15 min; wait up to 12 min
MAX_HEALTH_RETRIES=72
HEALTH_RETRY_INTERVAL=10

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

cleanup() {
    rm -f "$LOCKFILE"
}

build_frontend() {
    local SRC_DIR="$1"
    local DEST_DIR="$2"
    local NAME="$3"

    log "  Building $NAME in $SRC_DIR..."
    cd "$SRC_DIR"

    # Prefer npm ci (uses package-lock.json, reproducible) over yarn
    if [ -f "package-lock.json" ]; then
        log "  Using npm ci (package-lock.json found)"
        npm ci --prefer-offline 2>&1 || npm install --legacy-peer-deps 2>&1
    elif command -v yarn &>/dev/null && [ -f "yarn.lock" ]; then
        log "  Using yarn install"
        yarn install 2>&1
    else
        log "  Using npm install"
        npm install --legacy-peer-deps 2>&1
    fi

    log "  Running vite build..."
    # Use local vite binary for reliability
    if [ -f "node_modules/.bin/vite" ]; then
        node_modules/.bin/vite build 2>&1
    else
        npx --yes vite build 2>&1
    fi

    if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
        log "ERROR: Build failed - dist/ is empty or missing"
        return 1
    fi

    # Atomic swap: deploy to tmp dir then rename
    local TMP_DIR="${DEST_DIR}.tmp.$$"
    mkdir -p "$TMP_DIR"
    cp -r dist/* "$TMP_DIR/"

    # Swap atomically
    local OLD_DIR="${DEST_DIR}.old.$$"
    if [ -d "$DEST_DIR" ]; then
        mv "$DEST_DIR" "$OLD_DIR"
    fi
    mv "$TMP_DIR" "$DEST_DIR"
    rm -rf "$OLD_DIR" 2>/dev/null || true

    log "  $NAME deployed to $DEST_DIR ($(du -sh dist | cut -f1) built)"
    return 0
}

# --- Prevent concurrent runs ---
if [ -f "$LOCKFILE" ]; then
    LOCK_PID=$(cat "$LOCKFILE" 2>/dev/null || echo "")
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

log "Changes:"
git log --oneline "$LOCAL_HEAD".."$REMOTE_HEAD" 2>&1

# --- Pull latest code ---
log "[1/6] Pulling latest code..."
git pull origin "$BRANCH" 2>&1

# --- Detect what changed ---
CHANGED_FILES=$(git diff --name-only "$LOCAL_HEAD" "$REMOTE_HEAD" 2>/dev/null || git diff --name-only HEAD~1 HEAD)
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
BACKEND_OK=true
if [ "$BACKEND_CHANGED" = true ]; then
    log "[2/6] Building and deploying backend..."
    cd "$BACKEND_DIR"

    # Build in background to avoid blocking shell timeout
    docker compose up -d --build 2>&1
    log "  Backend containers rebuilding. Waiting for health check..."

    HEALTHY=false
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        sleep $HEALTH_RETRY_INTERVAL
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            HEALTHY=true
            log "  Backend healthy after $((i * HEALTH_RETRY_INTERVAL))s (attempt $i)"
            break
        fi
        if [ $((i % 6)) -eq 0 ]; then
            log "  Still waiting... attempt $i/$MAX_HEALTH_RETRIES - HTTP $HTTP_CODE"
        fi
    done

    if [ "$HEALTHY" = false ]; then
        log "ERROR: Backend health check failed after $((MAX_HEALTH_RETRIES * HEALTH_RETRY_INTERVAL))s!"
        log "Docker status:"
        docker compose ps 2>&1 || true
        log "Recent backend logs:"
        docker compose logs --tail=30 app 2>&1 || true
        BACKEND_OK=false
        log "WARN: Continuing with frontend deploy despite backend failure."
    fi
else
    log "[2/6] Backend unchanged, skipping build."
fi

# --- Frontend (user) deploy ---
FRONTEND_USER_OK=true
if [ "$FRONTEND_USER_CHANGED" = true ]; then
    log "[3/6] Building frontend (prava-test)..."
    if build_frontend "$FRONTEND_USER_SRC" "$FRONTEND_USER_DIR" "prava-test"; then
        log "  prava-test build SUCCESS"
    else
        log "ERROR: prava-test build FAILED (admin deploy will still run)"
        FRONTEND_USER_OK=false
    fi
else
    log "[3/6] Frontend (user) unchanged, skipping build."
fi

# --- Frontend (admin) deploy ---
FRONTEND_ADMIN_OK=true
if [ "$FRONTEND_ADMIN_CHANGED" = true ]; then
    log "[4/6] Building frontend (prava-admin)..."
    if build_frontend "$FRONTEND_ADMIN_SRC" "$FRONTEND_ADMIN_DIR" "prava-admin"; then
        log "  prava-admin build SUCCESS"
    else
        log "ERROR: prava-admin build FAILED"
        FRONTEND_ADMIN_OK=false
    fi
else
    log "[4/6] Frontend (admin) unchanged, skipping build."
fi

# --- Reload Nginx ---
if [ "$FRONTEND_USER_CHANGED" = true ] || [ "$FRONTEND_ADMIN_CHANGED" = true ]; then
    log "[5/6] Reloading Nginx..."
    if command -v systemctl &>/dev/null; then
        systemctl reload nginx 2>&1 || systemctl restart nginx 2>&1
    else
        service nginx reload 2>&1 || true
    fi
else
    log "[5/6] No frontend changes, skipping Nginx reload."
fi

# --- Docker cleanup ---
log "[6/6] Cleaning up Docker resources..."
docker image prune -f 2>&1 || true
docker builder prune -f --filter "until=24h" 2>&1 || true

# --- Summary ---
log "=========================================="
log "DEPLOY COMPLETE!"
log "  Commit:         $(git rev-parse --short HEAD)"
log "  Backend:        $BACKEND_CHANGED (ok=$BACKEND_OK)"
log "  User frontend:  $FRONTEND_USER_CHANGED (ok=$FRONTEND_USER_OK)"
log "  Admin frontend: $FRONTEND_ADMIN_CHANGED (ok=$FRONTEND_ADMIN_OK)"
log "=========================================="

# Exit with error if anything failed
if [ "$BACKEND_OK" = false ] || [ "$FRONTEND_USER_OK" = false ] || [ "$FRONTEND_ADMIN_OK" = false ]; then
    log "WARNING: Some components failed to deploy. Check logs above."
    exit 1
fi
