#!/bin/bash
# ======================================================
# PRAVA-ONLINE PRODUCTION SETUP SCRIPT
# Server: Ubuntu 22.04 | IP: 164.68.100.190
# ======================================================
set -euo pipefail

echo "============================================"
echo "  PRAVA-ONLINE PRODUCTION SETUP"
echo "============================================"

# ─── COLORS ───
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# STEP 1: DNS TEKSHIRISH
# ============================================
echo ""
echo "─── STEP 1: DNS tekshirish ───"

check_dns() {
    local domain=$1
    local expected="164.68.100.190"
    local result
    result=$(dig +short "$domain" A | head -1)
    if [ "$result" = "$expected" ]; then
        log "$domain → $result ✓"
    else
        err "$domain → $result (kutilgan: $expected)"
        echo "  DNS record sozlanmagan. Davom etishdan oldin DNS ni to'g'rilang."
        exit 1
    fi
}

check_dns "pravaonline.uz"
check_dns "admin.pravaonline.uz"

# ============================================
# STEP 2: PAKETLAR O'RNATISH
# ============================================
echo ""
echo "─── STEP 2: Paketlar o'rnatish ───"

sudo apt update -y
sudo apt install -y nginx certbot python3-certbot-nginx dnsutils curl

log "Nginx va Certbot o'rnatildi"

# ============================================
# STEP 3: DIREKTORIYALAR YARATISH
# ============================================
echo ""
echo "─── STEP 3: Direktoriyalar tayyorlash ───"

sudo mkdir -p /var/www/pravaonline.uz
sudo mkdir -p /var/www/admin
sudo mkdir -p /var/www/certbot
sudo mkdir -p /home/deploy/prava-online/logs
sudo mkdir -p /home/deploy/prava-online/uploads

sudo chown -R deploy:deploy /var/www/admin
sudo chown -R deploy:deploy /home/deploy/prava-online
sudo chown -R www-data:www-data /var/www/pravaonline.uz

log "Direktoriyalar tayyor"

# ============================================
# STEP 4: NGINX KONFIGURATSIYA
# ============================================
echo ""
echo "─── STEP 4: Nginx konfiguratsiya ───"

# Default config o'chirish
sudo rm -f /etc/nginx/sites-enabled/default

# pravaonline.uz config
sudo tee /etc/nginx/sites-available/pravaonline.uz > /dev/null << 'NGINX_MAIN'
# --- TEMPORARY HTTP-ONLY CONFIG (SSL oldin) ---
server {
    listen 80;
    listen [::]:80;
    server_name pravaonline.uz www.pravaonline.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        return 200 'pravaonline.uz is ready for SSL';
        add_header Content-Type text/plain;
    }
}
NGINX_MAIN

# admin.pravaonline.uz config
sudo tee /etc/nginx/sites-available/admin.pravaonline.uz > /dev/null << 'NGINX_ADMIN'
# --- TEMPORARY HTTP-ONLY CONFIG (SSL oldin) ---
server {
    listen 80;
    listen [::]:80;
    server_name admin.pravaonline.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        return 200 'admin.pravaonline.uz is ready for SSL';
        add_header Content-Type text/plain;
    }
}
NGINX_ADMIN

# Symlink
sudo ln -sf /etc/nginx/sites-available/pravaonline.uz /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/admin.pravaonline.uz /etc/nginx/sites-enabled/

# Test va restart
sudo nginx -t && sudo systemctl restart nginx
log "Nginx HTTP konfiguratsiya tayyor"

# ============================================
# STEP 5: UFW FIREWALL
# ============================================
echo ""
echo "─── STEP 5: Firewall (UFW) sozlash ───"

sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# 8080 faqat localhost uchun (tashqaridan yopiq)
sudo ufw deny 8080/tcp comment 'Block direct backend access'

sudo ufw --force enable
sudo ufw status verbose

log "Firewall sozlandi: 22, 80, 443 ochiq"

# ============================================
# STEP 6: SSL SERTIFIKAT
# ============================================
echo ""
echo "─── STEP 6: SSL sertifikat olish ───"

sudo certbot --nginx \
    -d pravaonline.uz \
    -d www.pravaonline.uz \
    --non-interactive \
    --agree-tos \
    --email admin@pravaonline.uz \
    --redirect

sudo certbot --nginx \
    -d admin.pravaonline.uz \
    --non-interactive \
    --agree-tos \
    --email admin@pravaonline.uz \
    --redirect

# Auto-renewal test
sudo certbot renew --dry-run

log "SSL sertifikatlar o'rnatildi"

# ============================================
# STEP 7: TO'LIQ NGINX KONFIGURATSIYA (SSL bilan)
# ============================================
echo ""
echo "─── STEP 7: To'liq Nginx config yozish ───"

# ─── pravaonline.uz ───
sudo tee /etc/nginx/sites-available/pravaonline.uz > /dev/null << 'NGINX_FULL_MAIN'
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=50r/s;

upstream spring_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name pravaonline.uz www.pravaonline.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name pravaonline.uz www.pravaonline.uz;

    ssl_certificate     /etc/letsencrypt/live/pravaonline.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/pravaonline.uz/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/pravaonline.uz/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml application/rss+xml image/svg+xml font/woff2;

    client_max_body_size 50M;
    client_body_timeout 60s;
    client_header_timeout 60s;

    proxy_connect_timeout 30s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;
    send_timeout 120s;

    access_log /var/log/nginx/pravaonline.uz.access.log;
    error_log  /var/log/nginx/pravaonline.uz.error.log warn;

    root /var/www/pravaonline.uz;
    index index.html;

    location / {
        limit_req zone=general_limit burst=30 nodelay;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        limit_req zone=api_limit burst=40 nodelay;
        proxy_pass http://spring_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Connection "";
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 4 64k;
        proxy_busy_buffers_size 128k;
    }

    # Swagger UI — /swagger orqali ochiladi
    location = /swagger {
        return 302 /swagger-ui/index.html;
    }

    location /swagger-ui/ {
        proxy_pass http://spring_backend/swagger-ui/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Connection "";
    }

    location /v3/api-docs {
        proxy_pass http://spring_backend/v3/api-docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location /webjars/ {
        proxy_pass http://spring_backend/webjars/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location = /favicon.ico { log_not_found off; access_log off; }
    location = /robots.txt  { log_not_found off; access_log off; }
}
NGINX_FULL_MAIN

# ─── admin.pravaonline.uz ───
sudo tee /etc/nginx/sites-available/admin.pravaonline.uz > /dev/null << 'NGINX_FULL_ADMIN'
server {
    listen 80;
    listen [::]:80;
    server_name admin.pravaonline.uz;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admin.pravaonline.uz;

    ssl_certificate     /etc/letsencrypt/live/admin.pravaonline.uz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.pravaonline.uz/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/admin.pravaonline.uz/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml image/svg+xml font/woff2;

    client_max_body_size 10M;

    access_log /var/log/nginx/admin.pravaonline.uz.access.log;
    error_log  /var/log/nginx/admin.pravaonline.uz.error.log warn;

    root /var/www/admin;
    index index.html;

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|map)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location = /favicon.ico { log_not_found off; access_log off; }
    location = /robots.txt  { log_not_found off; access_log off; }
}
NGINX_FULL_ADMIN

sudo nginx -t && sudo systemctl reload nginx
log "To'liq Nginx config o'rnatildi"

# ============================================
# STEP 8: SYSTEMD SERVICE
# ============================================
echo ""
echo "─── STEP 8: Systemd service sozlash ───"

sudo tee /etc/systemd/system/prava-online.service > /dev/null << 'SYSTEMD'
[Unit]
Description=Prava Online Spring Boot Application
After=network.target network-online.target
Wants=network-online.target

[Service]
Type=simple
User=deploy
Group=deploy
WorkingDirectory=/home/deploy/prava-online

ExecStart=/usr/bin/java \
    -Xms256m \
    -Xmx512m \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -Djava.security.egd=file:/dev/./urandom \
    -Dserver.address=0.0.0.0 \
    -Dserver.port=8080 \
    -Dspring.profiles.active=prod \
    -jar /home/deploy/prava-online/app.jar

ExecStop=/bin/kill -SIGTERM $MAINPID
SuccessExitStatus=143
TimeoutStopSec=30

Restart=on-failure
RestartSec=10
StartLimitIntervalSec=300
StartLimitBurst=5

Environment="JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64"
EnvironmentFile=-/home/deploy/prava-online/.env

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/deploy/prava-online/logs /home/deploy/prava-online/uploads /tmp
ProtectKernelTunables=true
ProtectControlGroups=true

StandardOutput=journal
StandardError=journal
SyslogIdentifier=prava-online

LimitNOFILE=65535
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
SYSTEMD

sudo systemctl daemon-reload
sudo systemctl enable prava-online
sudo systemctl start prava-online
sudo systemctl status prava-online --no-pager

log "Systemd service sozlandi va ishga tushirildi"

# ============================================
# STEP 9: LOG ROTATION
# ============================================
echo ""
echo "─── STEP 9: Log rotation ───"

sudo tee /etc/logrotate.d/prava-online > /dev/null << 'LOGROTATE'
/var/log/nginx/pravaonline.uz.access.log
/var/log/nginx/pravaonline.uz.error.log
/var/log/nginx/admin.pravaonline.uz.access.log
/var/log/nginx/admin.pravaonline.uz.error.log
{
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 $(cat /var/run/nginx.pid)
    endscript
}
LOGROTATE

log "Log rotation sozlandi"

# ============================================
# STEP 10: CERTBOT AUTO-RENEWAL TIMER
# ============================================
echo ""
echo "─── STEP 10: SSL auto-renewal ───"

sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

log "Certbot auto-renewal faollashtirildi"

# ============================================
# FINAL TEKSHIRUV
# ============================================
echo ""
echo "============================================"
echo "  FINAL TEKSHIRUV"
echo "============================================"

echo ""
echo "Nginx status:"
sudo systemctl is-active nginx

echo ""
echo "Backend status:"
sudo systemctl is-active prava-online

echo ""
echo "UFW status:"
sudo ufw status | head -10

echo ""
echo "SSL sertifikat:"
sudo certbot certificates 2>/dev/null | grep -A3 "Certificate Name"

echo ""
echo "Portlar:"
sudo ss -tlnp | grep -E ':(80|443|8080)\s'

echo ""
echo "============================================"
echo -e "${GREEN}  SETUP YAKUNLANDI!${NC}"
echo "============================================"
echo ""
echo "Tekshiring:"
echo "  https://pravaonline.uz          → Asosiy sayt"
echo "  https://pravaonline.uz/swagger  → Swagger UI"
echo "  https://pravaonline.uz/api/...  → Backend API"
echo "  https://admin.pravaonline.uz    → Admin panel"
echo ""
