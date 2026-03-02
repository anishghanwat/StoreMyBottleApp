import sys
import os

# Add current directory to sys.path
sys.path.append(os.getcwd())

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User, UserRole
from auth import hash_password, verify_password

def create_admin(email, password, name="Admin User"):
    db = SessionLocal()
    try:
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"User {email} already exists. Updating role to Admin...")
            user.role = UserRole.ADMIN
            user.hashed_password = hash_password(password)
            print(f"Password updated for {email}")
        else:
            print(f"Creating new admin user {email}...")
            user = User(
                email=email,
                hashed_password=hash_password(password),
                name=name,
                role=UserRole.ADMIN,
                phone="1234567890" # Dummy phone
            )
            db.add(user)
        
        db.commit()
        print("Successfully created/updated admin user!")
        return True
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_admin.py <email> <password>")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    create_admin(email, password)
