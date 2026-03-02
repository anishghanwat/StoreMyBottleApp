"""
Check if bartender exists and verify password
"""
import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
from models import User
from auth import verify_password

db = SessionLocal()

print("=" * 50)
print("Checking Bartender Account")
print("=" * 50)

email = "anishghanwat2003@gmail.com"

# Find user
user = db.query(User).filter(User.email == email).first()

if user:
    print(f"\n✅ User found:")
    print(f"   ID: {user.id}")
    print(f"   Name: {user.name}")
    print(f"   Email: {user.email}")
    print(f"   Phone: {user.phone}")
    print(f"   Role: {user.role}")
    print(f"   Venue ID: {user.venue_id}")
    print(f"   Has password: {bool(user.hashed_password)}")
    print(f"   Password hash: {user.hashed_password[:50] if user.hashed_password else 'None'}...")
    
    # Test password
    print("\n" + "=" * 50)
    print("Testing Password Verification")
    print("=" * 50)
    
    test_password = input("\nEnter the password you set for this bartender: ")
    
    if user.hashed_password:
        is_valid = verify_password(test_password, user.hashed_password)
        if is_valid:
            print("✅ Password is CORRECT")
        else:
            print("❌ Password is INCORRECT")
    else:
        print("❌ No password hash stored!")
else:
    print(f"\n❌ User not found with email: {email}")

db.close()
