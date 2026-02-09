import sys
import os

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import User, Venue

def debug_venues():
    db = SessionLocal()
    with open("debug_venues_out.txt", "w", encoding="utf-8") as f:
        try:
            f.write("\n=== Venues ===\n")
            venues = db.query(Venue).all()
            for v in venues:
                f.write(f"ID: {v.id} | Name: {v.name}\n")
                
            f.write("\n=== Bartenders ===\n")
            bartenders = db.query(User).filter(User.role == "bartender").all()
            for b in bartenders:
                v_name = "None"
                if b.venue_id:
                    venue = db.query(Venue).filter(Venue.id == b.venue_id).first()
                    if venue:
                        v_name = venue.name
                f.write(f"Email: {b.email} | Name: {b.name} | Venue ID: {b.venue_id} ({v_name})\n")
                
        finally:
            db.close()

if __name__ == "__main__":
    debug_venues()
