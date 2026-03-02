import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import User, UserRole
from auth import hash_password

def seed_bartender():
    db = SessionLocal()
    try:
        # Promote specific user if exists
        target_email = "anishghanwat2003@gmail.com"
        user = db.query(User).filter(User.email == target_email).first()
        if user:
            print(f"Found user {target_email}. Promoting to bartender...")
            user.role = "bartender"
            db.commit()
            print("✅ User promoted to bartender!")
        else:
            print(f"User {target_email} not found.")

        email = "bartender@example.com"
        user = db.query(User).filter(User.email == email).first()
        
        if user:
            print(f"User {email} already exists.")
            # Ensure role is bartender
            if user.role != "bartender":
                user.role = "bartender"
                print("Updated role to bartender.")
            
            # Force update password
            hashed_password = hash_password("password123")
            user.hashed_password = hashed_password
            db.commit()
            print("Updated password to 'password123'.")
            return

        print(f"Creating user {email}...")
        hashed_password = hash_password("password123")
        
        new_user = User(
            email=email,
            name="Bob the Bartender",
            hashed_password=hashed_password,
            role="bartender", # or UserRole.BARTENDER if enum works
            venue_id="1", # Skybar Lounge
            phone="+919999999999"
        )
        
        db.add(new_user)
        db.commit()
        print("✅ Bartender created successfully!")
        
    except Exception as e:
        print(f"❌ Error seeding bartender: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_bartender()
