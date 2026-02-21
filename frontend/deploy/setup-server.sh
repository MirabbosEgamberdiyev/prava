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

# prava-test (user) — port 80
cat > /etc/nginx/sites-available/prava-test << 'NGINX'
server {
    listen 80;
    server_name _;

    root /var/www/prava-test;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/prava-test.access.log;
    error_log  /var/log/nginx/prava-test.error.log;
}
NGINX

# prava-admin — port 8081
cat > /etc/nginx/sites-available/prava-admin << 'NGINX'
server {
    listen 8081;
    server_name _;

    root /var/www/prava-admin;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    access_log /var/log/nginx/prava-admin.access.log;
    error_log  /var/log/nginx/prava-admin.error.log;
}
NGINX

# Symlink yaratish
ln -sf /etc/nginx/sites-available/prava-test /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/prava-admin /etc/nginx/sites-enabled/

# Nginx test va restart
nginx -t
systemctl restart nginx

# ─── 6. Firewall (8081 portni ochish) ────────────────────────────────
echo "[6/6] Firewall sozlash..."
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 8081/tcp
    ufw allow 22/tcp
    echo "UFW rules qo'shildi"
fi

echo ""
echo "══════════════════════════════════════════"
echo " Setup tugadi!"
echo ""
echo " prava-test (user):  http://164.68.100.190"
echo " prava-admin:        http://164.68.100.190:8081"
echo "══════════════════════════════════════════"
