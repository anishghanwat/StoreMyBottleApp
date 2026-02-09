from sqlalchemy import text
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Migrating users table...")
        
        # Add hashed_password column if not exists
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255);"))
            print("Added hashed_password column.")
        except Exception as e:
            print(f"hashed_password column might already exist: {e}")

        # Add role column if not exists
        try:
            # MySQL enum syntax is tricky. Let's just use VARCHAR for now or Enum.
            # SQLAlchemy uses Enum but in raw SQL it's ENUM('customer', 'bartender', 'admin')
            conn.execute(text("ALTER TABLE users ADD COLUMN role ENUM('customer', 'bartender', 'admin') NOT NULL DEFAULT 'customer';"))
            print("Added role column.")
        except Exception as e:
            print(f"role column might already exist: {e}")

        # Add venue_id column if not exists
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN venue_id VARCHAR(36);"))
            print("Added venue_id column.")
            # Add FK constraint
            try:
                conn.execute(text("ALTER TABLE users ADD CONSTRAINT fk_user_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL;"))
                print("Added foreign key constraint.")
            except Exception as e:
                print(f"Foreign key might already exist: {e}")
        except Exception as e:
            print(f"venue_id column might already exist: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
