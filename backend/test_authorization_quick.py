"""
Quick Authorization Test - Phase 2 Task 2.4
Tests key authorization scenarios without hitting rate limits
"""
import requests
import time

BASE_URL = "http://localhost:8000"

print("\n" + "="*60)
print("Quick Authorization Test")
print("="*60)

# Login once and reuse token
print("\n1. Logging in as admin...")
time.sleep(1)
admin_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "admin@storemybottle.com", "password": "admin123"}
)

if admin_response.status_code == 200:
    admin_token = admin_response.json()["access_token"]
    print("   ✓ Admin login successful")
    
    # Test admin can access admin endpoints
    print("\n2. Testing admin access to admin endpoints...")
    time.sleep(0.5)
    response = requests.get(
        f"{BASE_URL}/api/admin/stats",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    if response.status_code == 200:
        print("   ✓ Admin can access /api/admin/stats")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    # Test admin can access venues
    print("\n3. Testing admin access to venues...")
    time.sleep(0.5)
    response = requests.get(
        f"{BASE_URL}/api/admin/venues",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    if response.status_code == 200:
        venues = response.json()
        print(f"   ✓ Admin can access venues ({len(venues)} found)")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    # Test admin can access purchases
    print("\n4. Testing admin access to purchases...")
    time.sleep(0.5)
    response = requests.get(
        f"{BASE_URL}/api/admin/purchases",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Admin can access purchases ({data.get('total', 0)} found)")
    else:
        print(f"   ✗ Failed: {response.status_code}")
    
    # Test admin can access redemptions
    print("\n5. Testing admin access to redemptions...")
    time.sleep(0.5)
    response = requests.get(
        f"{BASE_URL}/api/admin/redemptions",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Admin can access redemptions ({data.get('total', 0)} found)")
    else:
        print(f"   ✗ Failed: {response.status_code}")

else:
    print(f"   ✗ Admin login failed: {admin_response.status_code}")
    if admin_response.status_code == 429:
        print("   ⚠ Rate limited - wait 60 seconds and try again")

# Test bartender
print("\n6. Logging in as bartender...")
time.sleep(2)  # Wait to avoid rate limit
bartender_response = requests.post(
    f"{BASE_URL}/api/auth/login",
    json={"email": "anishghanwat2003@gmail.com", "password": "Anish@123"}
)

if bartender_response.status_code == 200:
    bartender_token = bartender_response.json()["access_token"]
    print("   ✓ Bartender login successful")
    
    # Test bartender CANNOT access admin endpoints
    print("\n7. Testing bartender CANNOT access admin endpoints...")
    time.sleep(0.5)
    response = requests.get(
        f"{BASE_URL}/api/admin/stats",
        headers={"Authorization": f"Bearer {bartender_token}"}
    )
    if response.status_code == 403:
        print("   ✓ Bartender correctly blocked from /api/admin/stats (403)")
    else:
        print(f"   ✗ Expected 403, got: {response.status_code}")
    
    # Get bartender's venue
    print("\n8. Getting bartender's assigned venue...")
    time.sleep(0.5)
    response = requests.get(
        f"{BASE_URL}/api/auth/me",
        headers={"Authorization": f"Bearer {bartender_token}"}
    )
    if response.status_code == 200:
        bartender_data = response.json()
        venue_id = bartender_data.get("venue_id")
        print(f"   ✓ Bartender assigned to venue: {venue_id}")
        
        if venue_id:
            # Test bartender can access their venue
            print("\n9. Testing bartender can access assigned venue...")
            time.sleep(0.5)
            response = requests.get(
                f"{BASE_URL}/api/purchases/venue/{venue_id}/pending",
                headers={"Authorization": f"Bearer {bartender_token}"}
            )
            if response.status_code == 200:
                print(f"   ✓ Bartender can access venue {venue_id} pending purchases")
            else:
                print(f"   ✗ Failed: {response.status_code}")
    else:
        print(f"   ✗ Failed to get bartender profile: {response.status_code}")

elif bartender_response.status_code == 429:
    print("   ⚠ Rate limited - wait 60 seconds and try again")
else:
    print(f"   ✗ Bartender login failed: {bartender_response.status_code}")

print("\n" + "="*60)
print("Authorization Test Complete")
print("="*60 + "\n")
