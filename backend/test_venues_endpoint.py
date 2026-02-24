"""
Test script to diagnose the /api/venues endpoint 500 error
"""
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings

def test_database_connection():
    """Test if database connection works"""
    print("=" * 50)
    print("Testing Database Connection...")
    print("=" * 50)
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful!")
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def test_venues_table():
    """Test if venues table exists and has data"""
    print("\n" + "=" * 50)
    print("Testing Venues Table...")
    print("=" * 50)
    
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_schema = DATABASE() 
                AND table_name = 'venues'
            """))
            table_exists = result.fetchone()[0] > 0
            
            if not table_exists:
                print("❌ Venues table does not exist!")
                return False
            
            print("✅ Venues table exists")
            
            # Check venue count
            result = conn.execute(text("SELECT COUNT(*) FROM venues"))
            count = result.fetchone()[0]
            print(f"✅ Found {count} venues in database")
            
            if count == 0:
                print("⚠️  Warning: No venues in database!")
                return False
            
            # Show sample venues
            result = conn.execute(text("SELECT id, name, location, is_open FROM venues LIMIT 3"))
            venues = result.fetchall()
            print("\nSample venues:")
            for venue in venues:
                print(f"  - {venue[1]} ({venue[2]}) - {'Open' if venue[3] else 'Closed'}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error checking venues table: {e}")
        return False

def test_venues_endpoint_logic():
    """Test the venues endpoint logic"""
    print("\n" + "=" * 50)
    print("Testing Venues Endpoint Logic...")
    print("=" * 50)
    
    try:
        from database import get_db
        from models import Venue
        from schemas import VenueList
        
        # Simulate the endpoint logic
        db = next(get_db())
        
        query = db.query(Venue)
        total = query.count()
        venues = query.limit(20).all()
        
        print(f"✅ Query executed successfully")
        print(f"✅ Total venues: {total}")
        print(f"✅ Returned venues: {len(venues)}")
        
        # Try to serialize to VenueList schema
        venue_list = VenueList(venues=venues, total=total)
        print(f"✅ Schema serialization successful")
        
        return True
        
    except Exception as e:
        print(f"❌ Error in endpoint logic: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    print("\n🔍 StoreMyBottle Backend Diagnostics")
    print("Testing /api/venues endpoint\n")
    
    # Run tests
    db_ok = test_database_connection()
    if not db_ok:
        print("\n❌ Database connection failed. Check your .env file and MySQL server.")
        sys.exit(1)
    
    venues_ok = test_venues_table()
    if not venues_ok:
        print("\n❌ Venues table issue. Run migrations or seed data.")
        sys.exit(1)
    
    endpoint_ok = test_venues_endpoint_logic()
    if not endpoint_ok:
        print("\n❌ Endpoint logic failed. Check the error above.")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ All tests passed!")
    print("=" * 50)
    print("\nThe /api/venues endpoint should work now.")
    print("If you're still getting 500 errors, restart the backend server:")
    print("\n  cd backend")
    print("  uvicorn main:app --reload --host 0.0.0.0 --port 8000 --ssl-keyfile=key.pem --ssl-certfile=cert.pem")

if __name__ == "__main__":
    main()
