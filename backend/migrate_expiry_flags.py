"""Add expires_at, warning_7d_sent, warning_1d_sent to purchases table"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from database import engine
from sqlalchemy import text


def add_column_if_missing(conn, table, column, definition):
    result = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c"
    ), {"t": table, "c": column})
    if result.scalar() == 0:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
        print(f"  ✅ Added column {column}")
    else:
        print(f"  ⏭  Column {column} already exists, skipping")


def migrate():
    with engine.connect() as conn:
        add_column_if_missing(conn, "purchases", "expires_at", "DATETIME NULL")
        add_column_if_missing(conn, "purchases", "warning_7d_sent", "BOOLEAN NOT NULL DEFAULT FALSE")
        add_column_if_missing(conn, "purchases", "warning_1d_sent", "BOOLEAN NOT NULL DEFAULT FALSE")

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
