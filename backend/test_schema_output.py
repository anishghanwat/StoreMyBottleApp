"""
Test what the schema outputs
"""
from decimal import Decimal
from schemas import BottleResponse

# Create a test bottle response
bottle_data = {
    "id": "test-123",
    "venue_id": "venue-456",
    "brand": "Test Brand",
    "name": "Test Bottle",
    "price": Decimal("1500.00"),
    "volume_ml": 750,
    "image_url": "https://example.com/image.jpg",
    "is_available": True
}

bottle = BottleResponse(**bottle_data)
print("Schema Output:")
print(bottle.model_dump())
print("\nJSON Output:")
print(bottle.model_dump_json(indent=2))
