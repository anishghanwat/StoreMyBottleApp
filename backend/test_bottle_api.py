"""
Test script to check what the bottle API is returning
"""
import sys
import os
sys.path.append(os.getcwd())

from database import SessionLocal
from models import Bottle
import json

db = SessionLocal()

print("========================================")
print("Testing Bottle API Data")
print("========================================\n")

# Get first bottle from database
bottle = db.query(Bottle).first()

if bottle:
    print("Database Model:")
    print(f"  ID: {bottle.id}")
    print(f"  Name: {bottle.name}")
    print(f"  Brand: {bottle.brand}")
    print(f"  Price: {bottle.price}")
    print(f"  Volume ML: {bottle.volume_ml}")
    print(f"  Image URL: {bottle.image_url}")
    print(f"  Available: {bottle.is_available}")
    
    print("\n" + "="*40)
    print("Testing Schema Serialization:")
    print("="*40 + "\n")
    
    # Test with schema
    from schemas import BottleResponse
    
    bottle_dict = {
        "id": bottle.id,
        "venue_id": bottle.venue_id,
        "brand": bottle.brand,
        "name": bottle.name,
        "price": bottle.price,
        "volume_ml": bottle.volume_ml,
        "image_url": bottle.image_url,
        "is_available": bottle.is_available
    }
    
    try:
        bottle_response = BottleResponse(**bottle_dict)
        print("Schema Output:")
        print(json.dumps(bottle_response.model_dump(), indent=2, default=str))
    except Exception as e:
        print(f"Schema Error: {e}")
        
else:
    print("❌ No bottles found in database!")
    print("\nRun: python init_db.py")

db.close()
