"""
Test signup functionality to diagnose ERR_EMPTY_RESPONSE
"""
import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
from models import User
from auth import hash_password
import traceback

print("=" * 50)
print("Testing Signup Components")
print("=" * 50)

# Test 1: Database connection
print("\n1. Testing database connection...")
try:
    db = SessionLocal()
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 2: Password hashing
print("\n2. Testing password hashing...")
try:
    test_password = "TestPass123"
    hashed = hash_password(test_password)
    print(f"✅ Password hashing successful")
    print(f"   Original: {test_password}")
    print(f"   Hashed: {hashed[:50]}...")
except Exception as e:
    print(f"❌ Password hashing failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check if test user exists
print("\n3. Checking for existing test user...")
test_email = "test@example.com"
try:
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        print(f"⚠️  Test user already exists: {existing.email}")
        print("   Deleting for clean test...")
        db.delete(existing)
        db.commit()
        print("✅ Test user deleted")
    else:
        print("✅ No existing test user")
except Exception as e:
    print(f"❌ Query failed: {e}")
    traceback.print_exc()
    sys.exit(1)

# Test 4: Create user
print("\n4. Testing user creation...")
try:
    user = User(
        email=test_email,
        name="Test User",
        hashed_password=hash_password("TestPass123"),
        role="customer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print("✅ User created successfully")
    print(f"   ID: {user.id}")
    print(f"   Email: {user.email}")
    print(f"   Name: {user.name}")
    print(f"   Role: {user.role}")
except Exception as e:
    print(f"❌ User creation failed: {e}")
    traceback.print_exc()
    db.rollback()
    sys.exit(1)

# Test 5: Verify user in database
print("\n5. Verifying user in database...")
try:
    verified_user = db.query(User).filter(User.email == test_email).first()
    if verified_user:
        print("✅ User verified in database")
        print(f"   ID: {verified_user.id}")
        print(f"   Email: {verified_user.email}")
    else:
        print("❌ User not found in database")
except Exception as e:
    print(f"❌ Verification failed: {e}")
    traceback.print_exc()

# Cleanup
print("\n6. Cleaning up test user...")
try:
    db.delete(user)
    db.commit()
    print("✅ Test user deleted")
except Exception as e:
    print(f"⚠️  Cleanup failed: {e}")

db.close()

print("\n" + "=" * 50)
print("All tests passed! ✅")
print("=" * 50)
print("\nIf signup still fails, check:")
print("1. Backend server logs for errors")
print("2. Database is running (MySQL)")
print("3. Environment variables are set correctly")
print("4. No firewall blocking port 8000")
