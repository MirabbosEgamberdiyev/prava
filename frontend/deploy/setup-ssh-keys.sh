#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# SSH Key Setup for GitLab CI/CD → Server deployment
# Bu skriptni LOKAL kompyuterda ishga tushiring
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

SERVER="164.68.100.190"
DEPLOY_USER="deploy"

echo "══════════════════════════════════════════"
echo " SSH Key Setup for CI/CD"
echo "══════════════════════════════════════════"

# ─── 1. SSH key pair yaratish ─────────────────────────────────────────
KEY_FILE="$HOME/.ssh/prava-deploy-key"

if [ -f "$KEY_FILE" ]; then
    echo "Kalit allaqachon mavjud: $KEY_FILE"
else
    echo "[1/3] SSH key pair yaratish..."
    ssh-keygen -t ed25519 -C "gitlab-ci-prava-deploy" -f "$KEY_FILE" -N ""
    echo "Kalit yaratildi: $KEY_FILE"
fi

# ─── 2. Public key'ni serverga ko'chirish ─────────────────────────────
echo "[2/3] Public key'ni serverga ko'chirish..."
echo "deploy user parolini kiriting:"
ssh-copy-id -i "$KEY_FILE.pub" "${DEPLOY_USER}@${SERVER}"

# ─── 3. Tekshirish ───────────────────────────────────────────────────
echo "[3/3] SSH ulanishni tekshirish..."
ssh -i "$KEY_FILE" -o BatchMode=yes "${DEPLOY_USER}@${SERVER}" "echo 'SSH key authentication ishlayapti!'"

echo ""
echo "══════════════════════════════════════════"
echo " Tayyor! Endi GitLab CI/CD variables'ga qo'shing:"
echo ""
echo " 1. GitLab → Settings → CI/CD → Variables"
echo ""
echo " Variable 1:"
echo "   Key:   SSH_PRIVATE_KEY"
echo "   Value: (quyidagi fayl mazmuni)"
echo "   Type:  Variable"
echo "   Flags: Masked, Protected"
cat "$KEY_FILE"
echo ""
echo ""
echo " Variable 2:"
echo "   Key:   SSH_KNOWN_HOSTS"
echo "   Value: (quyidagi qator)"
ssh-keyscan -H "$SERVER" 2>/dev/null
echo ""
echo ""
echo " Variable 3:"
echo "   Key:   DEPLOY_HOST"
echo "   Value: ${SERVER}"
echo "   Type:  Variable"
echo "   Flags: Protected"
echo ""
echo "══════════════════════════════════════════"
