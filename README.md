# StoreMyBottle

A SaaS platform for bottle storage at nightlife venues. Customers purchase and store bottles, bartenders manage redemptions via QR codes, and admins oversee the entire operation.

## Project Structure

```
StoreMyBottle/
├── backend/              # FastAPI + MySQL
│   ├── routers/          # API route handlers
│   ├── models.py         # SQLAlchemy models
│   ├── schemas.py        # Pydantic schemas
│   ├── auth.py           # JWT authentication
│   ├── main.py           # App entry point
│   └── crontab           # Scheduled jobs (expiry warnings)
├── frontend/             # Customer React app (Vite + TypeScript)
├── frontend-bartender/   # Bartender React app (Vite + TypeScript)
├── admin/                # Admin portal (Vite + TypeScript + shadcn/ui)
├── aws/                  # AWS CodeBuild specs (future use)
├── docs/                 # Reference documentation
├── docker-compose.yml          # Local development
└── docker-compose.prod.yml     # Production
```

## Tech Stack

- **Backend:** FastAPI, MySQL, JWT, Resend (email), Cloudinary (images), supercronic (cron)
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Framer Motion, Sonner
- **Admin:** React, TypeScript, Vite, shadcn/ui
- **Infrastructure:** Docker, nginx, EC2

## Local Development

### Docker (recommended)

```bash
docker-compose up -d
```

| App | URL |
|-----|-----|
| Customer | http://localhost:5173 |
| Bartender | http://localhost:5174 |
| Admin | http://localhost:3000 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |

### Manual Setup

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in values
python main.py
```

**Frontend (repeat for each app)**
```bash
cd frontend   # or frontend-bartender / admin
npm install
npm run dev
```

## Production Deployment

See `docs/DEPLOY.md` for the full EC2 + Docker deployment guide.

```bash
# On EC2
docker compose -f docker-compose.prod.yml up -d --build
```

## Environment Variables

Copy `.env.docker` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `MYSQL_*` | Database credentials |
| `JWT_SECRET_KEY` | Min 32 chars |
| `RESEND_API_KEY` | Email delivery |
| `CLOUDINARY_*` | Image uploads |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `VITE_API_URL` | Backend URL for frontends |

## Key Features

- Email/password auth with JWT refresh tokens
- Age verification (25+ enforced server-side)
- QR code redemption system (device-bound, time-limited)
- Bottle expiry email warnings (daily cron at 9am UTC)
- Role-based access: customer / bartender / admin
- Rate limiting with real IP detection (X-Forwarded-For)
- Cloudinary avatar uploads

## Production URLs

- Customer: https://storemybottle.in
- Bartender: https://bartender.storemybottle.in
- Admin: https://admin.storemybottle.in
- API: https://api.storemybottle.in

## Documentation

See `docs/` for deployment guides, architecture notes, and setup references.
