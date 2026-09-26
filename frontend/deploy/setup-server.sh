#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════
# Prava Online — Server Setup Script
# Server: 164.68.100.190
# Bu skriptni root sifatida bir marta ishga tushiring
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

echo "══════════════════════════════════════════"
echo " Prava Online — Server Setup"
echo "══════════════════════════════════════════"

# ─── 1. System update ────────────────────────────────────────────────
echo "[1/6] Tizimni yangilash..."
apt update && apt upgrade -y

# ─── 2. Nginx o'rnatish ──────────────────────────────────────────────
echo "[2/6] Nginx o'rnatish..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# ─── 3. Web kataloglar yaratish ──────────────────────────────────────
echo "[3/6] Web kataloglar yaratish..."
mkdir -p /var/www/prava-test
mkdir -p /var/www/prava-admin

# deploy userga ownership berish
chown -R deploy:deploy /var/www/prava-test
chown -R deploy:deploy /var/www/prava-admin
chmod -R 755 /var/www/prava-test
chmod -R 755 /var/www/prava-admin

# ─── 4. deploy userga nginx reload ruxsati berish ────────────────────
echo "[4/6] deploy userga sudo nginx reload ruxsati berish..."
cat > /etc/sudoers.d/deploy-nginx << 'EOF'
deploy ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx, /usr/bin/systemctl restart nginx
EOF
chmod 440 /etc/sudoers.d/deploy-nginx

# ─── 5. Nginx konfiguratsiya ─────────────────────────────────────────
echo "[5/6] Nginx konfiguratsiyalarni o'rnatish..."

# Default config'ni o'chirish
rm -f /etc/nginx/sites-enabled/default

# Konfiguratsiyalar repo'dagi deploy/nginx/ dan olinadi (inline nusxalar eskirib qolardi).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p /etc/nginx/snippets
cp "$SCRIPT_DIR/nginx/prava-test.conf"  /etc/nginx/sites-available/prava-test
cp "$SCRIPT_DIR/nginx/prava-admin.conf" /etc/nginx/sites-available/prava-admin
cp "$SCRIPT_DIR/nginx/snippets/prava-security-headers.conf" /etc/nginx/snippets/
# Admin kirish nazorati: mavjud bo'lmasa example'dan (faqat localhost'ga ruxsat) yaratiladi.
if [ ! -f /etc/nginx/snippets/prava-admin-access.conf ]; then
    cp "$SCRIPT_DIR/nginx/snippets/prava-admin-access.conf.example" /etc/nginx/snippets/prava-admin-access.conf
    echo "DIQQAT: /etc/nginx/snippets/prava-admin-access.conf ga admin IP'larini qo'shing"
fi
if [ ! -f /etc/nginx/.htpasswd-prava-admin ]; then
    echo "DIQQAT: sudo htpasswd -c /etc/nginx/.htpasswd-prava-admin <login> ni bajaring"
    touch /etc/nginx/.htpasswd-prava-admin
fi
# Symlink yaratish
ln -sf /etc/nginx/sites-available/prava-test /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/prava-admin /etc/nginx/sites-enabled/

# Nginx test va restart
nginx -t
systemctl restart nginx

# ─── 6. Firewall ──────────────────────────────────────────────────
echo "[6/6] Firewall sozlash..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw delete allow 8081/tcp 2>/dev/null || true   # admin endi faqat admin.pravaonline.uz (HTTPS) orqali
    ufw allow 22/tcp
    echo "UFW rules qo'shildi"
fi

echo ""
echo "══════════════════════════════════════════"
echo " Setup tugadi!"
echo ""
echo " prava-test (user):  http://164.68.100.190"
echo " prava-admin:        https://admin.pravaonline.uz  (certbot --nginx -d admin.pravaonline.uz)"
echo "══════════════════════════════════════════"
