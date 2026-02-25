"""Add Pune venues to the database"""
from database import SessionLocal
from models import Venue, Bottle
from decimal import Decimal

def add_pune_venues():
    db = SessionLocal()
    
    try:
        # Check if Pune venues already exist
        existing = db.query(Venue).filter(Venue.location.ilike("%Pune%")).first()
        if existing:
            print("✓ Pune venues already exist")
            return
        
        print("Adding Pune venues...")
        
        # Venue 1: High Spirits, Koregaon Park
        venue1 = Venue(
            name="High Spirits",
            location="Koregaon Park, Pune",
            is_open=True,
            contact_email="info@highspirits.in",
            contact_phone="+91-20-26130405",
            image_url="https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600"
        )
        db.add(venue1)
        db.flush()
        
        # Add bottles for High Spirits
        bottles1 = [
            Bottle(
                venue_id=venue1.id,
                brand="Johnnie Walker",
                name="Black Label",
                price=Decimal("3500.00"),
                volume_ml=750,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"
            ),
            Bottle(
                venue_id=venue1.id,
                brand="Grey Goose",
                name="Vodka",
                price=Decimal("4200.00"),
                volume_ml=750,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1560508801-e1d1f2f1c9b0?w=400"
            ),
        ]
        db.add_all(bottles1)
        
        # Venue 2: 1000 Oaks, Viman Nagar
        venue2 = Venue(
            name="1000 Oaks",
            location="Viman Nagar, Pune",
            is_open=True,
            contact_email="contact@1000oaks.in",
            contact_phone="+91-20-26633333",
            image_url="https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600"
        )
        db.add(venue2)
        db.flush()
        
        # Add bottles for 1000 Oaks
        bottles2 = [
            Bottle(
                venue_id=venue2.id,
                brand="Chivas Regal",
                name="12 Year Old",
                price=Decimal("3200.00"),
                volume_ml=750,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"
            ),
            Bottle(
                venue_id=venue2.id,
                brand="Absolut",
                name="Vodka",
                price=Decimal("2800.00"),
                volume_ml=750,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1560508801-e1d1f2f1c9b0?w=400"
            ),
        ]
        db.add_all(bottles2)
        
        # Venue 3: Effingut, Koregaon Park
        venue3 = Venue(
            name="Effingut",
            location="Koregaon Park, Pune",
            is_open=True,
            contact_email="hello@effingut.in",
            contact_phone="+91-20-26160000",
            image_url="https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600"
        )
        db.add(venue3)
        db.flush()
        
        # Add bottles for Effingut
        bottles3 = [
            Bottle(
                venue_id=venue3.id,
                brand="Jack Daniel's",
                name="Old No. 7",
                price=Decimal("3000.00"),
                volume_ml=750,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"
            ),
            Bottle(
                venue_id=venue3.id,
                brand="Bacardi",
                name="White Rum",
                price=Decimal("2500.00"),
                volume_ml=750,
                is_available=True,
                image_url="https://images.unsplash.com/photo-1560508801-e1d1f2f1c9b0?w=400"
            ),
        ]
        db.add_all(bottles3)
        
        db.commit()
        print("✅ Successfully added 3 Pune venues with bottles!")
        print("\nVenues added:")
        print("1. High Spirits - Koregaon Park, Pune")
        print("2. 1000 Oaks - Viman Nagar, Pune")
        print("3. Effingut - Koregaon Park, Pune")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_pune_venues()
