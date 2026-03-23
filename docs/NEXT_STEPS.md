# StoreMyBottle — Next Steps

Last updated: March 2026

---

## Status Summary

| Item | Status | Notes |
|------|--------|-------|
| Rate limiting | ✅ Done | All auth endpoints have `@limiter.limit()` |
| JWT refresh | ✅ Done | Full refresh flow in backend + frontend interceptor |
| N+1 query fix | ✅ Not needed | Venues/bottles are simple single-table queries |
| Sentry | ❌ Todo | No error tracking in production |
| Venue ratings | ❌ Todo | Frontend hardcodes `4.8` |
| Bottle inventory auto-tracking | ❌ Todo | `is_available` is manual only |
| Uptime monitoring | ❌ Todo | No alerting if backend goes down |

---

## 1. Sentry — Error Tracking

**Why:** Right now, if a user hits a JS crash or a backend 500 in production, you find out from them. Sentry catches every error with a full stack trace, user context, and breadcrumbs.

**Effort:** ~1 hour total across frontend + backend.

### Backend

```bash
pip install sentry-sdk[fastapi]
```

Add to `backend/requirements.txt`:
```
sentry-sdk[fastapi]==2.x.x
```

Add to `backend/main.py` before app creation:
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    environment=settings.ENVIRONMENT,
    traces_sample_rate=0.2,  # 20% of requests for performance monitoring
    send_default_pii=False,  # Don't send PII
)
```

Add to `backend/config.py` Settings class:
```python
SENTRY_DSN: Optional[str] = None
```

Add to `backend/.env.example`:
```
SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

### Frontend (customer app)

```bash
npm install @sentry/react
```

Add to `frontend/src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [Sentry.browserTracingIntegration()],
  tracesSampleRate: 0.2,
  enabled: import.meta.env.PROD,
});
```

Wrap `ErrorBoundary` in `App.tsx`:
```typescript
// Replace existing ErrorBoundary with Sentry's version for automatic capture
import * as Sentry from "@sentry/react";
// Sentry.ErrorBoundary wraps your existing one
```

Add to `frontend/.env.example`:
```
VITE_SENTRY_DSN=https://your-key@sentry.io/your-project-id
```

Repeat the same install + init for `frontend-bartender/` and `admin/` — each should have its own Sentry project so errors are separated by app.

### Setup steps on sentry.io
1. Create account at sentry.io (free tier: 5k errors/month)
2. Create 4 projects: `smb-backend`, `smb-customer`, `smb-bartender`, `smb-admin`
3. Copy each DSN into the respective `.env` on the server
4. Restart containers

---

## 2. Venue Ratings

**Why:** The frontend currently hardcodes `4.8` for open venues. This is fake data that erodes trust.

**Effort:** ~3 hours (backend model + endpoint + frontend wired up).

### Backend — new model in `models.py`

```python
class VenueRating(Base):
    __tablename__ = "venue_ratings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    venue_id = Column(String(36), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1–5
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("venue_id", "user_id", name="uq_venue_user_rating"),
    )
```

### Backend — update `VenueResponse` in `schemas.py`

```python
class VenueResponse(VenueBase):
    id: str
    created_at: datetime
    rating: Optional[float] = None      # add this
    rating_count: Optional[int] = None  # add this
```

### Backend — update `get_venues` in `routers/venues.py`

```python
from sqlalchemy import func
from models import VenueRating

# After fetching venues, attach average ratings
venue_ids = [v.id for v in venues]
ratings = db.query(
    VenueRating.venue_id,
    func.avg(VenueRating.rating).label("avg_rating"),
    func.count(VenueRating.id).label("count")
).filter(VenueRating.venue_id.in_(venue_ids)).group_by(VenueRating.venue_id).all()

rating_map = {r.venue_id: (round(float(r.avg_rating), 1), r.count) for r in ratings}

# Attach to response manually or add computed property to model
```

### Backend — new POST endpoint

```
POST /api/venues/{venue_id}/rate
Body: { "rating": 4 }
Auth: required (customer only)
Rules: user must have at least one confirmed purchase at this venue
```

### Frontend — `VenueSelection.tsx`

Replace:
```typescript
<span className="text-white">{venue.is_open ? "4.8" : "—"}</span>
```
With:
```typescript
<span className="text-white">
  {venue.rating ? venue.rating.toFixed(1) : "—"}
</span>
```

Show rating count as tooltip or subtext: `(${venue.rating_count} ratings)`.

Add a rating prompt after a successful redemption — "How was your experience at {venue}?" with 1–5 stars. Only show once per venue per user.

---

## 3. Bottle Inventory Auto-Tracking

**Why:** If every purchase of a bottle has `remaining_ml = 0`, the bottle is effectively sold out but still shows as available. Admins have to manually toggle `is_available`.

**Effort:** ~1 hour (backend logic only, no frontend changes needed).

### Option A — Auto-mark on redemption (recommended)

In `routers/redemptions.py`, after a redemption is confirmed and `remaining_ml` hits 0:

```python
# After updating purchase.remaining_ml = 0
# Check if ALL purchases of this bottle are empty
from sqlalchemy import func
active_count = db.query(Purchase).filter(
    Purchase.bottle_id == purchase.bottle_id,
    Purchase.remaining_ml > 0,
    Purchase.payment_status == PaymentStatus.CONFIRMED
).count()

# Note: this tracks customer stock, not venue stock
# Only auto-mark unavailable if venue explicitly has no stock
# Better to leave is_available as a manual admin flag
# and instead surface a "low stock" warning in the admin panel
```

**Recommendation:** Keep `is_available` as a manual admin flag (venue controls their own stock). Instead, add a `stock_count` field to `Bottle` that admins can set, and show a "Low Stock" badge in the admin panel when `stock_count < 5`.

### Schema change

```python
# models.py — add to Bottle
stock_count = Column(Integer, nullable=True)  # null = unlimited/untracked
```

```python
# schemas.py — add to BottleResponse
stock_count: Optional[int] = None
```

Admin panel already has a bottle edit form — just add a stock count field there.

---

## 4. Uptime Monitoring

**Why:** The backend went down silently today. You found out from a CORS error in the browser. You should get a Telegram/email alert within 5 minutes.

**Effort:** 10 minutes.

### Setup (free)

1. Go to [uptimerobot.com](https://uptimerobot.com) — free tier monitors every 5 minutes
2. Create monitor:
   - Type: HTTPS
   - URL: `https://api.storemybottle.in/health`
   - Friendly name: `SMB Backend`
   - Alert when: down for 1 check (5 min)
3. Add alert contact: Telegram bot or email
4. Optionally add monitors for the three frontends too:
   - `https://storemybottle.in`
   - `https://admin.storemybottle.in`
   - `https://bartender.storemybottle.in`

The `/health` endpoint already exists and returns `{"status": "healthy"}`.

---

## Implementation Order

1. **Uptime Robot** — 10 minutes, no code, immediate value
2. **Sentry** — 1 hour, catches production crashes you'd otherwise never see
3. **Venue ratings** — 3 hours, removes the fake hardcoded `4.8`
4. **Bottle stock tracking** — 1 hour, quality-of-life for admins

---

## Environment Variables Needed on Server

After implementing the above, add these to `/backend/.env` on the EC2 instance:

```bash
SENTRY_DSN=https://your-key@sentry.io/your-backend-project
```

And to each frontend's `.env.production`:
```bash
VITE_SENTRY_DSN=https://your-key@sentry.io/your-frontend-project
```

Then rebuild and redeploy:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```
