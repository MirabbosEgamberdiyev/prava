# Prava Online

Professional Driving License Exam Platform - Haydovchilik guvohnomasi imtihon platformasi.

## Project Structure

```
prava/
├── frontend/          # React frontend apps
│   ├── prava-test/    # User exam app (pravaonline.uz)
│   ├── prava-admin/   # Admin panel (admin.pravaonline.uz)
│   └── deploy/        # Nginx configs & deployment scripts
├── backend/           # Spring Boot API server
│   ├── src/           # Java source code
│   ├── deploy/        # Server setup & deployment configs
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

## Tech Stack

**Frontend:**
- React 19 + TypeScript + Vite
- Mantine UI
- PWA (Progressive Web App)
- i18n (multi-language)

**Backend:**
- Spring Boot 3.2.1 + Java 17
- PostgreSQL 16
- JWT + Google OAuth + Telegram Auth
- Swagger/OpenAPI

## Server

- IP: `164.68.100.190`
- Frontend: Nginx (port 80/443)
- Backend: Docker (port 8080)
- Domains: `pravaonline.uz`, `admin.pravaonline.uz`

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env  # Fill in your secrets
mvn clean package -DskipTests
docker-compose up -d
```

### Frontend
```bash
cd frontend/prava-test
yarn install
yarn dev

cd frontend/prava-admin
yarn install
yarn dev
```

## Deployment

Automated via `auto-deploy.sh`:
- Cron polls GitHub every 10 minutes
- Only rebuilds changed components (backend / user frontend / admin frontend)
- Logs: `/var/log/prava-deploy.log`

Manual trigger:
```bash
ssh root@164.68.100.190 "bash /opt/prava/auto-deploy.sh"
```
