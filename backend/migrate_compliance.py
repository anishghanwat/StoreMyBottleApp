"""
Migration: Add date_of_birth and terms_accepted_at to users table.
Run once inside the backend container:
  docker exec storemybottle_backend_prod python migrate_compliance.py
"""
from database import engine
from sqlalchemy import text

def run():
    with engine.connect() as conn:
        # Add date_of_birth column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN date_of_birth DATE NULL"))
            print("✅ Added date_of_birth column")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print("⚠️  date_of_birth already exists, skipping")
            else:
                raise

        # Add terms_accepted_at column
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN terms_accepted_at DATETIME NULL"))
            print("✅ Added terms_accepted_at column")
        except Exception as e:
            if "Duplicate column" in str(e) or "already exists" in str(e):
                print("⚠️  terms_accepted_at already exists, skipping")
            else:
                raise

        conn.commit()
    print("✅ Migration complete")

if __name__ == "__main__":
    run()
