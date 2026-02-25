"""
Test API endpoints to verify timestamps are properly formatted
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_timestamps():
    print("=" * 80)
    print("API TIMESTAMP TEST")
    print("=" * 80)
    print()
    
    # Test 1: Get venues
    print("1. Testing /api/venues")
    print("-" * 80)
    try:
        response = requests.get(f"{BASE_URL}/api/venues")
        if response.status_code == 200:
            data = response.json()
            if data.get('venues'):
                venue = data['venues'][0]
                created_at = venue.get('created_at')
                print(f"   Sample venue created_at: {created_at}")
                
                # Try to parse it
                try:
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    print(f"   ✅ Parsed successfully: {dt}")
                    print(f"   Timezone: {dt.tzinfo}")
                except Exception as e:
                    print(f"   ❌ Failed to parse: {e}")
        else:
            print(f"   ❌ Request failed: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print()
    
    # Test 2: Login and get bottles (requires auth)
    print("2. Testing authenticated endpoints")
    print("-" * 80)
    print("   (Skipping - requires authentication)")
    print()
    
    print("=" * 80)
    print("To fully test, make API requests from the frontend and check browser console")
    print("=" * 80)

if __name__ == "__main__":
    test_timestamps()
