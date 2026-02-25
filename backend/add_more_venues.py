#!/usr/bin/env python3
"""
Add more venues to different cities
Adds 2-3 venues each in Mumbai, Bangalore, and Delhi
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models import Venue
from datetime import datetime, timezone

def add_venues():
    db = SessionLocal()
    try:
        # Mumbai Venues (adding 3 more)
        mumbai_venues = [
            {
                "name": "The Bombay Canteen",
                "location": "Lower Parel, Mumbai",
                "is_open": True,
                "contact_email": "hello@thebombaycanteen.com",
                "contact_phone": "+91-22-49666666",
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"
            },
            {
                "name": "Aer Lounge",
                "location": "Worli, Mumbai",
                "is_open": True,
                "contact_email": "info@aerlounge.in",
                "contact_phone": "+91-22-66171234",
                "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"
            },
            {
                "name": "Trilogy",
                "location": "Juhu, Mumbai",
                "is_open": True,
                "contact_email": "contact@trilogy.in",
                "contact_phone": "+91-22-26605555",
                "image_url": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600"
            }
        ]
        
        # Bangalore Venues (adding 3 more)
        bangalore_venues = [
            {
                "name": "Toit Brewpub",
                "location": "Indiranagar, Bangalore",
                "is_open": True,
                "contact_email": "hello@toit.in",
                "contact_phone": "+91-80-41714466",
                "image_url": "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600"
            },
            {
                "name": "Skyye Lounge",
                "location": "UB City, Bangalore",
                "is_open": True,
                "contact_email": "info@skyye.in",
                "contact_phone": "+91-80-41755555",
                "image_url": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600"
            },
            {
                "name": "The Humming Tree",
                "location": "Indiranagar, Bangalore",
                "is_open": True,
                "contact_email": "contact@thehummingtree.in",
                "contact_phone": "+91-80-41738888",
                "image_url": "https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=600"
            }
        ]
        
        # Delhi Venues (adding 3)
        delhi_venues = [
            {
                "name": "Kitty Su",
                "location": "The Lalit, New Delhi",
                "is_open": True,
                "contact_email": "info@kittysu.in",
                "contact_phone": "+91-11-44447777",
                "image_url": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600"
            },
            {
                "name": "PCO",
                "location": "Connaught Place, New Delhi",
                "is_open": True,
                "contact_email": "hello@pcobar.in",
                "contact_phone": "+91-11-41516666",
                "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600"
            },
            {
                "name": "Summer House Cafe",
                "location": "Hauz Khas Village, New Delhi",
                "is_open": True,
                "contact_email": "contact@summerhousecafe.com",
                "contact_phone": "+91-11-46060444",
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600"
            }
        ]
        
        all_venues = mumbai_venues + bangalore_venues + delhi_venues
        
        print(f"\n{'='*60}")
        print(f"  Adding {len(all_venues)} new venues")
        print(f"{'='*60}\n")
        
        added_count = 0
        skipped_count = 0
        
        for venue_data in all_venues:
            # Check if venue already exists
            existing = db.query(Venue).filter(
                Venue.name == venue_data["name"]
            ).first()
            
            if existing:
                print(f"⚠️  Skipped: {venue_data['name']} (already exists)")
                skipped_count += 1
                continue
            
            # Create new venue
            venue = Venue(
                name=venue_data["name"],
                location=venue_data["location"],
                is_open=venue_data["is_open"],
                contact_email=venue_data["contact_email"],
                contact_phone=venue_data["contact_phone"],
                image_url=venue_data["image_url"]
            )
            
            db.add(venue)
            # Extract city from location for display
            city = venue_data["location"].split(",")[-1].strip()
            print(f"✅ Added: {venue_data['name']} ({city})")
            added_count += 1
        
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"  Summary")
        print(f"{'='*60}")
        print(f"✅ Added: {added_count} venues")
        print(f"⚠️  Skipped: {skipped_count} venues")
        print(f"{'='*60}\n")
        
        # Show venue count by city (extracted from location)
        print("Venue count by city:")
        all_venues_db = db.query(Venue).all()
        city_counts = {}
        for v in all_venues_db:
            city = v.location.split(",")[-1].strip()
            city_counts[city] = city_counts.get(city, 0) + 1
        
        for city, count in sorted(city_counts.items()):
            print(f"  {city}: {count} venues")
        
        total = db.query(Venue).count()
        print(f"\nTotal venues in database: {total}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    add_venues()
