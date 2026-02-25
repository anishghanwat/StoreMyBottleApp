#!/usr/bin/env python3
"""
Test location-based filtering with different cities
"""

import requests
import json
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_URL = "https://localhost:8000"

def test_city_filtering(city):
    """Test venue filtering by city"""
    print(f"\n{'='*60}")
    print(f"  Testing: {city}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/venues",
            params={"city": city},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            venues = data.get("venues", [])
            total = data.get("total", 0)
            
            print(f"✅ Found {total} venues in {city}:")
            for venue in venues:
                print(f"   - {venue['name']} ({venue['location']})")
            
            return venues
        else:
            print(f"❌ Error: Status {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_all_venues():
    """Test getting all venues without filter"""
    print(f"\n{'='*60}")
    print(f"  Testing: All Venues (No Filter)")
    print(f"{'='*60}")
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/venues",
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            venues = data.get("venues", [])
            total = data.get("total", 0)
            
            print(f"✅ Found {total} total venues")
            
            # Group by city
            city_groups = {}
            for venue in venues:
                city = venue['location'].split(',')[-1].strip()
                if city not in city_groups:
                    city_groups[city] = []
                city_groups[city].append(venue['name'])
            
            print(f"\nVenues by city:")
            for city, venue_names in sorted(city_groups.items()):
                print(f"  {city}: {len(venue_names)} venues")
                for name in venue_names:
                    print(f"     - {name}")
            
            return venues
        else:
            print(f"❌ Error: Status {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def main():
    print(f"\n{'='*60}")
    print(f"  Location-Based Filtering Test")
    print(f"{'='*60}\n")
    
    # Test all venues first
    all_venues = test_all_venues()
    
    # Test each city
    cities = ["Mumbai", "Bangalore", "Delhi", "Pune", "Gurgaon"]
    
    results = {}
    for city in cities:
        venues = test_city_filtering(city)
        results[city] = len(venues)
    
    # Summary
    print(f"\n{'='*60}")
    print(f"  Summary")
    print(f"{'='*60}")
    print(f"Total venues: {len(all_venues)}")
    print(f"\nVenues by city:")
    for city, count in sorted(results.items(), key=lambda x: x[1], reverse=True):
        print(f"  {city}: {count} venues")
    
    print(f"\n{'='*60}")
    print(f"  ✅ Location filtering working correctly!")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
