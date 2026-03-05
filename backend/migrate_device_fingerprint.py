"""
Add device_fingerprint column to redemptions table
Phase 3 Task 3.5: Enhance QR Code Security
"""
from sqlalchemy import create_engine, text
from config import settings

def migrate():
    """Add device_fingerprint column to redemptions table"""
    engine = create_engine(settings.DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Add device_fingerprint column
            conn.execute(text("""
                ALTER TABLE redemptions 
                ADD COLUMN device_fingerprint VARCHAR(255) NULL
                AFTER redeemed_by_staff_id
            """))
            conn.commit()
            print("✅ Added device_fingerprint column to redemptions table")
        except Exception as e:
            if "Duplicate column name" in str(e):
                print("ℹ️  device_fingerprint column already exists")
            else:
                print(f"❌ Error: {e}")
                raise

if __name__ == "__main__":
    print("Adding device_fingerprint column to redemptions table...")
    migrate()
    print("Migration complete!")
