"""
Test that Pydantic schemas properly serialize timezone-aware datetimes
"""
from datetime import datetime, timezone, timedelta
from schemas import RedemptionResponse, UserBottleResponse, PurchaseResponse
from models import RedemptionStatus, PaymentStatus
import json

def test_serialization():
    print("=" * 80)
    print("PYDANTIC TIMESTAMP SERIALIZATION TEST")
    print("=" * 80)
    print()
    
    # Test 1: RedemptionResponse with timezone-naive datetime
    print("1. Testing RedemptionResponse with timezone-naive datetime")
    print("-" * 80)
    
    # Simulate what comes from database (timezone-naive)
    naive_dt = datetime(2026, 2, 24, 18, 0, 0)
    print(f"   Input (naive): {naive_dt} (tzinfo: {naive_dt.tzinfo})")
    
    redemption = RedemptionResponse(
        id="test-123",
        purchase_id="purchase-456",
        peg_size_ml=60,
        qr_token="token-789",
        qr_data='{"test": "data"}',
        qr_expires_at=naive_dt,
        status=RedemptionStatus.PENDING,
        created_at=naive_dt
    )
    
    # Serialize to JSON
    json_data = redemption.model_dump_json()
    parsed = json.loads(json_data)
    
    print(f"   Output JSON qr_expires_at: {parsed['qr_expires_at']}")
    print(f"   Output JSON created_at: {parsed['created_at']}")
    
    # Check if it has timezone info
    if '+' in parsed['qr_expires_at'] or 'Z' in parsed['qr_expires_at']:
        print("   ✅ Timezone info present!")
    else:
        print("   ❌ No timezone info!")
    
    print()
    
    # Test 2: RedemptionResponse with timezone-aware datetime
    print("2. Testing RedemptionResponse with timezone-aware datetime")
    print("-" * 80)
    
    aware_dt = datetime(2026, 2, 24, 18, 0, 0, tzinfo=timezone.utc)
    print(f"   Input (aware): {aware_dt} (tzinfo: {aware_dt.tzinfo})")
    
    redemption2 = RedemptionResponse(
        id="test-123",
        purchase_id="purchase-456",
        peg_size_ml=60,
        qr_token="token-789",
        qr_data='{"test": "data"}',
        qr_expires_at=aware_dt,
        status=RedemptionStatus.PENDING,
        created_at=aware_dt
    )
    
    json_data2 = redemption2.model_dump_json()
    parsed2 = json.loads(json_data2)
    
    print(f"   Output JSON qr_expires_at: {parsed2['qr_expires_at']}")
    print(f"   Output JSON created_at: {parsed2['created_at']}")
    
    if '+' in parsed2['qr_expires_at'] or 'Z' in parsed2['qr_expires_at']:
        print("   ✅ Timezone info present!")
    else:
        print("   ❌ No timezone info!")
    
    print()
    
    # Test 3: UserBottleResponse
    print("3. Testing UserBottleResponse")
    print("-" * 80)
    
    expires_at = datetime(2026, 3, 26, 18, 0, 0)  # Naive
    print(f"   Input expires_at (naive): {expires_at}")
    
    bottle = UserBottleResponse(
        id="bottle-123",
        bottleId="bottle-456",
        venueName="Test Venue",
        bottleName="Test Bottle",
        bottleBrand="Test Brand",
        totalMl=750,
        remainingMl=500,
        image="test.jpg",
        expiresAt=expires_at
    )
    
    json_data3 = bottle.model_dump_json(by_alias=True)
    parsed3 = json.loads(json_data3)
    
    print(f"   Output JSON expiresAt: {parsed3['expiresAt']}")
    
    if '+' in parsed3['expiresAt'] or 'Z' in parsed3['expiresAt']:
        print("   ✅ Timezone info present!")
    else:
        print("   ❌ No timezone info!")
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print("All datetime fields should now include timezone information (+00:00 or Z)")
    print("This ensures consistent time handling across frontend and backend.")
    print("=" * 80)

if __name__ == "__main__":
    test_serialization()
