"""
Expiry warning cron job.
Sends email and push reminders to users whose bottles expire in ~7 days, ~3 days, or ~1 day.

Run daily at 9am via cron inside the backend container:
  docker exec storemybottle_backend_prod python send_expiry_warnings.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta, timezone
from database import SessionLocal
from models import Purchase, PaymentStatus, PushSubscription
from email_service import send_expiry_warning_email
from config import settings


def send_push_notification(endpoint: str, p256dh: str, auth: str, title: str, body: str, url: str = "/"):
    """Send a single web push notification via pywebpush"""
    try:
        from pywebpush import webpush, WebPushException
        import json
        webpush(
            subscription_info={"endpoint": endpoint, "keys": {"p256dh": p256dh, "auth": auth}},
            data=json.dumps({"title": title, "body": body, "url": url}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_EMAIL},
        )
    except Exception as e:
        raise e


def run():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # 7-day window: expires between now+6d and now+8d
        seven_day = db.query(Purchase).filter(
            Purchase.payment_status == PaymentStatus.CONFIRMED,
            Purchase.remaining_ml > 0,
            Purchase.purchased_at.isnot(None),
            Purchase.expires_at.isnot(None),
            Purchase.warning_7d_sent == False,
            Purchase.expires_at >= now + timedelta(days=6),
            Purchase.expires_at <= now + timedelta(days=8),
        ).all()

        # 3-day window: expires between now+2d and now+4d
        three_day = db.query(Purchase).filter(
            Purchase.payment_status == PaymentStatus.CONFIRMED,
            Purchase.remaining_ml > 0,
            Purchase.purchased_at.isnot(None),
            Purchase.expires_at.isnot(None),
            Purchase.warning_3d_sent == False,
            Purchase.expires_at >= now + timedelta(days=2),
            Purchase.expires_at <= now + timedelta(days=4),
        ).all()

        # 1-day window: expires between now and now+2d
        one_day = db.query(Purchase).filter(
            Purchase.payment_status == PaymentStatus.CONFIRMED,
            Purchase.remaining_ml > 0,
            Purchase.purchased_at.isnot(None),
            Purchase.expires_at.isnot(None),
            Purchase.warning_1d_sent == False,
            Purchase.expires_at >= now,
            Purchase.expires_at <= now + timedelta(days=2),
        ).all()

        sent = 0
        for days_left, purchases in [(7, seven_day), (3, three_day), (1, one_day)]:
            for p in purchases:
                user = p.user
                if not user:
                    continue

                bottle_info = {
                    "brand": p.bottle.brand,
                    "name": p.bottle.name,
                    "venue_name": p.venue.name,
                    "remaining_ml": p.remaining_ml,
                    "expires_at": p.expires_at.strftime("%d %b %Y"),
                    "days_left": days_left,
                }

                # Send email
                if user.email:
                    ok = send_expiry_warning_email(
                        email=user.email,
                        user_name=user.name,
                        bottles=[bottle_info],
                        days_left=days_left,
                    )
                    if ok:
                        print(f"  ✅ Email sent to {user.email}")

                # Send web push to all subscriptions
                push_subs = db.query(PushSubscription).filter(
                    PushSubscription.user_id == user.id
                ).all()

                for sub in push_subs:
                    try:
                        send_push_notification(
                            endpoint=sub.endpoint,
                            p256dh=sub.p256dh,
                            auth=sub.auth,
                            title=f"🍷 Bottle expiring in {days_left} day{'s' if days_left > 1 else ''}",
                            body=f"{bottle_info['brand']} {bottle_info['name']} at {bottle_info['venue_name']} — {bottle_info['remaining_ml']}ml remaining",
                            url="/my-bottles",
                        )
                        print(f"  ✅ Push sent to {user.email or user.id}")
                    except Exception as e:
                        print(f"  ⚠️  Push failed: {e}")

                if days_left == 7:
                    p.warning_7d_sent = True
                elif days_left == 3:
                    p.warning_3d_sent = True
                else:
                    p.warning_1d_sent = True
                db.commit()
                sent += 1

        print(f"\n✅ Expiry warnings done — {sent} email(s) sent")

    finally:
        db.close()


if __name__ == "__main__":
    print(f"🕐 Running expiry warnings at {datetime.now(timezone.utc).isoformat()}")
    run()
