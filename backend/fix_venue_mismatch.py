import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User

def fix_venue():
    db = SessionLocal()
    try:
        # Update Anish
        anish = db.query(User).filter(User.email == "anishghanwat2003@gmail.com").first()
        if anish:
            anish.venue_id = "4" # Electric Dreams
            print(f"Updated {anish.email} to Venue 4 (Electric Dreams)")
            
        # Update Bob
        bob = db.query(User).filter(User.email == "bartender@example.com").first()
        if bob:
            bob.venue_id = "4" # Electric Dreams
            print(f"Updated {bob.email} to Venue 4 (Electric Dreams)")
            
        db.commit()
        print("✅ Venue IDs updated successfully!")
        
    finally:
        db.close()

if __name__ == "__main__":
    fix_venue()
