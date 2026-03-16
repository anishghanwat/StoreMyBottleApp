"""
Expiry warning cron job.
Sends email reminders to users whose bottles expire in 7 days or 1 day.

Run daily at 9am via cron inside the backend container:
  docker exec storemybottle_backend_prod python send_expiry_warnings.py

Or set up on EC2:
  0 9 * * * docker exec storemybottle_backend_prod python send_expiry_warnings.py >> /var/log/expiry_warnings.log 2>&1
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta, timezone
from collections import defaultdict
from database import SessionLocal
from models import Purchase, PaymentStatus
from email_service import send_expiry_warning_email


def run():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # Find all confirmed purchases with remaining ml
        purchases = db.query(Purchase).filter(
            Purchase.payment_status == PaymentStatus.CONFIRMED,
            Purchase.remaining_ml > 0,
        ).all()

        # Group by user and days_left bucket (1 or 7)
        buckets: dict[tuple, list] = defaultdict(list)

        for p in purchases:
            purchase_date = p.purchased_at or p.created_at
            if purchase_date.tzinfo is None:
                purchase_date = purchase_date.replace(tzinfo=timezone.utc)
            expires_at = purchase_date + timedelta(days=30)
            days_left = (expires_at - now).days

            if days_left in (1, 7):
                user = p.user
                if not user or not user.email:
                    continue
                key = (user.id, user.email, user.name, days_left)
                buckets[key].append({
                    "brand": p.bottle.brand,
                    "name": p.bottle.name,
                    "venue_name": p.venue.name,
                    "remaining_ml": p.remaining_ml,
                    "expires_at": expires_at.strftime("%d %b %Y"),
                    "days_left": days_left,
                })

        sent = 0
        for (user_id, email, user_name, days_left), bottles in buckets.items():
            ok = send_expiry_warning_email(
                email=email,
                user_name=user_name,
                bottles=bottles,
                days_left=days_left,
            )
            if ok:
                sent += 1
                print(f"  ✅ Sent {days_left}-day warning to {email} ({len(bottles)} bottle(s))")

        print(f"\n✅ Expiry warnings done — {sent} email(s) sent")

    finally:
        db.close()


if __name__ == "__main__":
    print(f"🕐 Running expiry warnings at {datetime.now(timezone.utc).isoformat()}")
    run()
