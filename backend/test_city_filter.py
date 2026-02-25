"""Test city-based venue filtering"""
import requests

BASE_URL = "http://0.0.0.0:8000/api"

def test_city_filter():
    print("Testing city-based venue filtering...\n")
    
    # Test 1: Get all venues
    print("1. Getting all venues:")
    response = requests.get(f"{BASE_URL}/venues")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Total venues: {data['total']}")
        for venue in data['venues'][:3]:
            print(f"   - {venue['name']}: {venue['location']}")
    else:
        print(f"   ✗ Error: {response.status_code}")
    
    print()
    
    # Test 2: Filter by Mumbai
    print("2. Filtering by city: Mumbai")
    response = requests.get(f"{BASE_URL}/venues", params={"city": "Mumbai"})
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Venues in Mumbai: {data['total']}")
        for venue in data['venues']:
            print(f"   - {venue['name']}: {venue['location']}")
    else:
        print(f"   ✗ Error: {response.status_code}")
    
    print()
    
    # Test 3: Filter by Bangalore
    print("3. Filtering by city: Bangalore")
    response = requests.get(f"{BASE_URL}/venues", params={"city": "Bangalore"})
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Venues in Bangalore: {data['total']}")
        for venue in data['venues']:
            print(f"   - {venue['name']}: {venue['location']}")
    else:
        print(f"   ✗ Error: {response.status_code}")
    
    print()
    
    # Test 4: Filter by non-existent city
    print("4. Filtering by city: Delhi")
    response = requests.get(f"{BASE_URL}/venues", params={"city": "Delhi"})
    if response.status_code == 200:
        data = response.json()
        print(f"   ✓ Venues in Delhi: {data['total']}")
        if data['total'] == 0:
            print("   (No venues found - expected)")
    else:
        print(f"   ✗ Error: {response.status_code}")
    
    print("\n✅ All tests completed!")

if __name__ == "__main__":
    try:
        test_city_filter()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend. Make sure it's running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")
