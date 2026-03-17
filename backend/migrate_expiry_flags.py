"""Add expires_at, warning_7d_sent, warning_1d_sent to purchases table"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from database import engine
from sqlalchemy import text


def migrate():
    with engine.connect() as conn:
        conn.execute(text("""
            ALTER TABLE purchases
            ADD COLUMN IF NOT EXISTS expires_at DATETIME NULL,
            ADD COLUMN IF NOT EXISTS warning_7d_sent BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS warning_1d_sent BOOLEAN NOT NULL DEFAULT FALSE
        """))
        # Backfill expires_at for existing confirmed purchases
        conn.execute(text("""
            UPDATE purchases
            SET expires_at = DATE_ADD(purchased_at, INTERVAL 30 DAY)
            WHERE payment_status = 'confirmed'
              AND purchased_at IS NOT NULL
              AND expires_at IS NULL
        """))
        conn.commit()
    print("✅ Migration complete")


if __name__ == "__main__":
    migrate()
