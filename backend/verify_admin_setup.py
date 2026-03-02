"""
Verify Admin Panel Setup
This script checks if everything is configured correctly for the admin panel.
"""

from database import SessionLocal
from models import User, Venue
from auth import hash_password, verify_password

def verify_setup():
    db = SessionLocal()
    
    print("=" * 60)
    print("ADMIN PANEL SETUP VERIFICATION")
    print("=" * 60)
    
    # Check 1: Admin user exists
    print("\n1. Checking Admin User...")
    admin = db.query(User).filter(User.email == "admin@storemybottle.com").first()
    if admin:
        print(f"   ✅ Admin user exists")
        print(f"   - ID: {admin.id}")
        print(f"   - Email: {admin.email}")
        print(f"   - Name: {admin.name}")
        print(f"   - Role: {admin.role}")
        
        # Verify password
        if admin.hashed_password:
            is_valid = verify_password("admin123", admin.hashed_password)
            if is_valid:
                print(f"   ✅ Password 'admin123' is correct")
            else:
                print(f"   ❌ Password 'admin123' is NOT correct")
        else:
            print(f"   ❌ No password set")
    else:
        print(f"   ❌ Admin user NOT found")
        print(f"   Run: python create_admin.py admin@storemybottle.com admin123")
    
    # Check 2: Venues exist
    print("\n2. Checking Venues...")
    venues = db.query(Venue).all()
    if venues:
        print(f"   ✅ {len(venues)} venue(s) found:")
        for venue in venues:
            print(f"   - {venue.name} ({venue.location})")
    else:
        print(f"   ⚠️  No venues found")
        print(f"   Create venues in the admin panel: Venues → Add Venue")
    
    # Check 3: Bartenders exist
    print("\n3. Checking Bartenders...")
    bartenders = db.query(User).filter(User.role == "bartender").all()
    if bartenders:
        print(f"   ✅ {len(bartenders)} bartender(s) found:")
        for bartender in bartenders:
            venue_name = "No venue"
            if bartender.venue_id:
                venue = db.query(Venue).filter(Venue.id == bartender.venue_id).first()
                if venue:
                    venue_name = venue.name
            print(f"   - {bartender.name} ({bartender.email or bartender.phone}) → {venue_name}")
    else:
        print(f"   ℹ️  No bartenders found")
        print(f"   Create bartenders in the admin panel: Bartenders → Add Bartender")
    
    # Check 4: Users exist
    print("\n4. Checking Total Users...")
    total_users = db.query(User).count()
    print(f"   Total users: {total_users}")
    
    # Breakdown by role
    customers = db.query(User).filter(User.role == "customer").count()
    bartenders_count = db.query(User).filter(User.role == "bartender").count()
    admins = db.query(User).filter(User.role == "admin").count()
    
    print(f"   - Customers: {customers}")
    print(f"   - Bartenders: {bartenders_count}")
    print(f"   - Admins: {admins}")
    
    print("\n" + "=" * 60)
    print("SETUP STATUS")
    print("=" * 60)
    
    all_good = True
    
    if not admin:
        print("❌ Admin user missing - Run create_admin.py")
        all_good = False
    elif not admin.hashed_password or not verify_password("admin123", admin.hashed_password):
        print("❌ Admin password incorrect - Run create_admin.py")
        all_good = False
    else:
        print("✅ Admin user configured correctly")
    
    if not venues:
        print("⚠️  No venues - Create venues in admin panel first")
    else:
        print(f"✅ {len(venues)} venue(s) available")
    
    if all_good:
        print("\n✅ Setup is complete! You can now:")
        print("   1. Start backend: cd backend && python main.py")
        print("   2. Start admin panel: cd admin && npm run dev")
        print("   3. Login with: admin@storemybottle.com / admin123")
    else:
        print("\n❌ Setup incomplete - Fix issues above")
    
    print("=" * 60)
    
    db.close()

if __name__ == "__main__":
    verify_setup()
