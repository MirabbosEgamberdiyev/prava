# Troubleshooting Guide — pravaonline.uz

## 502 Bad Gateway

**Sabab**: Nginx backendga ulana olmayapti (8080 port).

```bash
# 1. Backend ishlayaptimi?
sudo systemctl status prava-online
journalctl -u prava-online --no-pager -n 50

# 2. Port tinglayaptimi?
sudo ss -tlnp | grep 8080

# 3. Backend qo'l bilan tekshirish
curl -v http://127.0.0.1:8080/api/health

# 4. Java process bormi?
ps aux | grep java

# 5. JAR file bormi?
ls -la /home/deploy/prava-online/app.jar

# 6. Java o'rnatilganmi?
java -version

# 7. Loglarni ko'rish
journalctl -u prava-online -f
tail -100 /home/deploy/prava-online/logs/application.log

# 8. Memory tekshirish (OOM bo'lishi mumkin)
free -h
dmesg | grep -i "out of memory"

# 9. Qayta ishga tushirish
sudo systemctl restart prava-online
sleep 5
curl http://127.0.0.1:8080/api/health
```

**Yechimlar:**
- JAR file yo'q → deploy qilish kerak
- Java yo'q → `sudo apt install -y openjdk-17-jdk-headless`
- Port band → `sudo fuser -k 8080/tcp` keyin restart
- Memory yetmayapti → Xms/Xmx qiymatlarini kamaytirish

---

## Swagger Ishlamayapti

### Muammo 1: 404 — Swagger sahifasi topilmadi

```bash
# Backend to'g'ridan-to'g'ri tekshirish
curl -I http://127.0.0.1:8080/swagger-ui/index.html
curl -I http://127.0.0.1:8080/v3/api-docs
```

**Yechim:** SpringDoc dependency qo'shilganmi tekshiring:
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

### Muammo 2: Swagger ochiladi lekin API chaqiruvlar xato beradi

**Sabab:** Swagger HTTPS orqali ochilgan, lekin API chaqiruvlarni HTTP ga yuborayapti.

**Yechim — application.properties ga qo'shing:**
```properties
server.forward-headers-strategy=framework
springdoc.swagger-ui.servers[0].url=https://pravaonline.uz
```

### Muammo 3: context-path muammosi

Agar `server.servlet.context-path=/api` sozlangan bo'lsa:

```properties
# Swagger manzil o'zgaradi:
# /api/swagger-ui/index.html
# /api/v3/api-docs
```

**Nginx da ham o'zgartirish kerak:**
```nginx
location /swagger {
    proxy_pass http://spring_backend/api/swagger-ui/index.html;
}
location /swagger-ui/ {
    proxy_pass http://spring_backend/api/swagger-ui/;
}
location /v3/api-docs {
    proxy_pass http://spring_backend/api/v3/api-docs;
}
```

### Muammo 4: X-Forwarded headerlar ishlamayapti

```bash
# Tekshirish — backendga kelayotgan headerlar
curl -H "X-Forwarded-Proto: https" \
     -H "X-Forwarded-Host: pravaonline.uz" \
     http://127.0.0.1:8080/v3/api-docs | python3 -m json.tool | head -20
```

`servers` massivida URL ni tekshiring. `http://` bo'lsa muammo bor:
```properties
# Qo'shing:
server.forward-headers-strategy=framework
```

---

## Nginx Muammolari

```bash
# Konfiguratsiya sintaksisni tekshirish
sudo nginx -t

# Nginx loglar
tail -50 /var/log/nginx/pravaonline.uz.error.log
tail -50 /var/log/nginx/admin.pravaonline.uz.error.log

# Nginx qayta yuklash
sudo systemctl reload nginx

# Barcha aktiv server blocklarni ko'rish
ls -la /etc/nginx/sites-enabled/

# Portlarni tekshirish
sudo ss -tlnp | grep nginx
```

---

## SSL Muammolari

```bash
# Sertifikat muddatini tekshirish
sudo certbot certificates

# Yangilashni sinash
sudo certbot renew --dry-run

# Qo'lda yangilash
sudo certbot renew --force-renewal

# Sertifikat tafsilotlari
echo | openssl s_client -connect pravaonline.uz:443 -servername pravaonline.uz 2>/dev/null | openssl x509 -noout -dates

# Mixed content tekshirish
curl -I https://pravaonline.uz
# Strict-Transport-Security headeri bormi?
```

---

## UFW Muammolari

```bash
# Status
sudo ufw status verbose

# Agar noto'g'ri rule qo'shilgan bo'lsa
sudo ufw status numbered
sudo ufw delete <number>

# Reset (ehtiyot bo'ling!)
# sudo ufw reset
```

---

## Foydali Monitoring Buyruqlari

```bash
# Real-time nginx loglar
tail -f /var/log/nginx/pravaonline.uz.access.log

# Backend loglar
journalctl -u prava-online -f

# Disk usage
df -h

# Memory
free -h

# CPU va process
htop

# Nginx connections
sudo ss -s

# Backend health check script
curl -sf http://127.0.0.1:8080/api/health > /dev/null && echo "UP" || echo "DOWN"
```

---

## Quick Recovery Checklist

Agar hammasi buzilsa, qadamma-qadam tiklash:

```bash
# 1. Backend
sudo systemctl restart prava-online
sleep 10
curl http://127.0.0.1:8080/api/health

# 2. Nginx
sudo nginx -t
sudo systemctl restart nginx

# 3. Firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 4. SSL
sudo certbot renew

# 5. Umumiy test
curl -I https://pravaonline.uz
curl -I https://admin.pravaonline.uz
curl https://pravaonline.uz/swagger
```
