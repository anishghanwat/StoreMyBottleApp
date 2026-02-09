from database import engine
from sqlalchemy import text

def add_columns():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE venues ADD COLUMN contact_email VARCHAR(255)"))
            print("Added contact_email column")
        except Exception as e:
            print(f"contact_email might already exist: {e}")
            
        try:
            conn.execute(text("ALTER TABLE venues ADD COLUMN contact_phone VARCHAR(20)"))
            print("Added contact_phone column")
        except Exception as e:
            print(f"contact_phone might already exist: {e}")
            
        conn.commit()

if __name__ == "__main__":
    print("Running manual migration...")
    add_columns()
    print("Done")
