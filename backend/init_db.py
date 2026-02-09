"""
Database initialization script for StoreMyBottle

This script creates all tables and seeds initial data for development.
"""

from database import engine, Base, SessionLocal
from models import Venue, Bottle, User
from decimal import Decimal
import sys


def init_database():
    """Initialize database with tables and seed data"""
    print("🗄️  Creating database tables...")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully")
    
    # Seed data
    print("\n🌱 Seeding initial data...")
    db = SessionLocal()
    
    try:
        # Check if data already exists
        existing_venues = db.query(Venue).count()
        if existing_venues > 0:
            print("⚠️  Database already contains data. Skipping seed.")
            return
        
        # Create venues
        venues_data = [
            {
                "id": "1",
                "name": "Skybar Lounge",
                "location": "Bandra West, Mumbai",
                "is_open": True,
                "image_url": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800"
            },
            {
                "id": "2",
                "name": "Neon Nights",
                "location": "Indiranagar, Bangalore",
                "is_open": True,
                "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800"
            },
            {
                "id": "3",
                "name": "The Purple Room",
                "location": "Cyber Hub, Gurgaon",
                "is_open": False,
                "image_url": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800"
            },
            {
                "id": "4",
                "name": "Electric Dreams",
                "location": "Koramangala, Bangalore",
                "is_open": True,
                "image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800"
            }
        ]
        
        venues = []
        for venue_data in venues_data:
            venue = Venue(**venue_data)
            db.add(venue)
            venues.append(venue)
        
        db.commit()
        print(f"✅ Created {len(venues)} venues")
        
        # Create bottles for each venue
        bottles_data = [
            {"venue_id": "1", "brand": "Jack Daniel's", "name": "Tennessee Whiskey", "price": Decimal("4500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"},
            {"venue_id": "1", "brand": "Johnnie Walker", "name": "Black Label", "price": Decimal("5200"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1564958334269-92932d687267?w=400"},
            {"venue_id": "1", "brand": "Absolut", "name": "Vodka", "price": Decimal("3800"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1597897982993-9c590c37e9c6?w=400"},
            {"venue_id": "1", "brand": "Bacardi", "name": "White Rum", "price": Decimal("3200"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400"},
            {"venue_id": "1", "brand": "Bombay Sapphire", "name": "Gin", "price": Decimal("4000"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1621986049284-4b34c31f0bf1?w=400"},
            {"venue_id": "1", "brand": "Grey Goose", "name": "Vodka", "price": Decimal("8500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1597897982993-9c590c37e9c6?w=400"},
            
            {"venue_id": "2", "brand": "Glenfiddich", "name": "12 Year Old", "price": Decimal("6500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400"},
            {"venue_id": "2", "brand": "Chivas Regal", "name": "18 Year Old", "price": Decimal("7500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1564958334269-92932d687267?w=400"},
            {"venue_id": "2", "brand": "Tanqueray", "name": "Gin", "price": Decimal("3500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1621986049284-4b34c31f0bf1?w=400"},
            
            {"venue_id": "4", "brand": "Patron", "name": "Silver Tequila", "price": Decimal("9500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400"},
            {"venue_id": "4", "brand": "Hendrick's", "name": "Gin", "price": Decimal("5500"), "volume_ml": 750, "image_url": "https://images.unsplash.com/photo-1621986049284-4b34c31f0bf1?w=400"},
        ]
        
        bottles = []
        for bottle_data in bottles_data:
            bottle = Bottle(**bottle_data)
            db.add(bottle)
            bottles.append(bottle)
        
        db.commit()
        print(f"✅ Created {len(bottles)} bottles")
        
        # Create a test user
        test_user = User(
            id="test-user-1",
            name="Test User",
            email="test@storemybottle.com",
            phone="+919876543210"
        )
        db.add(test_user)
        db.commit()
        print("✅ Created test user")
        
        print("\n🎉 Database initialization complete!")
        print("\n📝 Test credentials:")
        print("   Email: test@storemybottle.com")
        print("   Phone: +919876543210")
        
    except Exception as e:
        print(f"\n❌ Error seeding data: {e}")
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
