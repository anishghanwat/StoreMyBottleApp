
import httpx
import asyncio
import random
import string
import json

BASE_URL = "http://localhost:8000/api"

def generate_email():
    return f"test_{''.join(random.choices(string.ascii_lowercase, k=8))}@example.com"

async def run_test():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0, follow_redirects=True) as client:
        print("🚀 Starting End-to-End Verification Flow")
        
        # 1. Sign Up / Login (Mocked via Google Login endpoint which creates user if not exists)
        # Actually we use our dev login endpoint if available, but since we only have Google/Phone, 
        # we might need to rely on the fact that Google Login accepts any token in our mock implementation?
        # Let's check auth.py. 
        # If 'mock' not available, we might need a way to create user.
        # Wait, Step 868: I implemented `google_login` which verifies token. 
        # If I don't have a valid google token, I can't login?
        # UNLESS I use the phone login flow which sends OTP (fixed '1234').
        
        print("\n1️⃣  Authenticating via Phone (Mock OTP)...")
        phone = f"+9199{random.randint(10000000, 99999999)}"
        
        # Send OTP
        resp = await client.post("/auth/phone/send-otp", json={"phone": phone})
        assert resp.status_code == 200, f"Send OTP failed: {resp.text}"
        otp_data = resp.json()
        print(f"   [DEBUG] OTP Response: {otp_data}")
        otp_code = otp_data.get("debug_otp", "123456") # Fallback if not in dev mode (will fail)
        print(f"   OTP Sent to {phone} (Debug Code: {otp_code})")
        
        # Verify OTP
        resp = await client.post("/auth/phone/verify-otp", json={"phone": phone, "otp_code": otp_code})
        assert resp.status_code == 200, f"Verify OTP failed: {resp.text}"
        token_data = resp.json()
        access_token = token_data["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        print(f"   Logged in! Token: {access_token[:10]}...")
        
        # 2. Get Venues
        print("\n2️⃣  Fetching Venues...")
        resp = await client.get("/venues/")
        if resp.status_code != 200:
            print(f"❌ Failed to fetch venues: {resp.status_code} - {resp.text}")
        assert resp.status_code == 200
        data = resp.json()
        venues = data['venues']
        assert len(venues) > 0, "No venues found"
        venue = venues[0]
        print(f"   Selected Venue: {venue['name']} (ID: {venue['id']})")
        
        # 3. Get Bottles
        print("\n3️⃣  Fetching Bottles...")
        resp = await client.get(f"/venues/{venue['id']}/bottles")
        assert resp.status_code == 200
        data = resp.json()
        bottles = data['bottles']
        assert len(bottles) > 0, "No bottles found"
        bottle = bottles[0]
        print(f"   Selected Bottle: {bottle['name']} - {bottle['brand']} (₹{bottle['price']})")
        
        # 4. Create Purchase
        print("\n4️⃣  Creating Purchase...")
        resp = await client.post("/purchases/", json={
            "bottle_id": bottle['id'],
            "venue_id": venue['id']
        }, headers=headers)
        if resp.status_code not in [200, 201]:
            print(f"❌ Purchase creation failed: {resp.status_code} - {resp.text}")
        assert resp.status_code in [200, 201], f"Purchase creation failed: {resp.text}"
        purchase = resp.json()
        print(f"   Purchase Created (ID: {purchase['id']})")
        
        # 5. Confirm Payment
        print("\n5️⃣  Confirming Payment...")
        # confirm_payment expects payment_method
        resp = await client.post(f"/purchases/{purchase['id']}/confirm", json={
            "payment_method": "upi"
        }, headers=headers)
        assert resp.status_code == 200, f"Payment confirmation failed: {resp.text}"
        print("   Payment Confirmed!")
        
        # 6. Check My Bottles
        print("\n6️⃣  Checking Inventory...")
        resp = await client.get("/purchases/my-bottles", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        my_bottles = data['bottles']
        user_bottle = next((b for b in my_bottles if b['bottleName'] == bottle['name']), None)
        assert user_bottle is not None, "Purchased bottle not found in inventory"
        print(f"   Bottle found in inventory! Remaining: {user_bottle['remainingMl']}ml")
        
        # 7. Redeem Peg
        print("\n7️⃣  Redeeming 60ml Peg...")
        # Need purchase_id from user_bottle which is actually the 'purchase.id' ? 
        # Wait, UserBottle endpoint returns 'id' which is Purchase ID? 
        # Let's check api.types.ts: 
        # export interface UserBottle { id: string; ... } -> This IS the purchase ID.
        purchase_id = user_bottle['id']
        
        resp = await client.post("/redemptions/generate-qr", json={
            "purchase_id": purchase_id,
            "peg_size_ml": 60
        }, headers=headers)
        assert resp.status_code == 200, f"Redemption generation failed: {resp.text}"
        redemption_data = resp.json()
        qr_token = redemption_data['qr_token']
        print(f"   QR Generated! Token: {qr_token[:10]}...")
        
        # 8. Validate QR (Bartender Action)
        print("\n8️⃣  Simulating Bartender Scan...")
        # This is a public endpoint (or protected by bartender auth? Currently public/protected but for simulation we might need auth? 
        # Wait, validate endpoint is typically for the bartender app. 
        # Our backend `validate_redemption_qr` endpoint... let's check routers/redemptions.py
        # It is: @router.post("/validate", response_model=QRValidationResponse)
        # It does NOT verify user token, it just validates the QR token string.
        
        resp = await client.post("/redemptions/validate", json={
            "qr_token": qr_token
        })
        assert resp.status_code == 200, f"Validation failed: {resp.text}"
        validation_result = resp.json()
        assert validation_result['success'] == True
        print(f"   Validation Successful! Message: {validation_result['message']}")
        
        # 9. Verify Balance Logic
        print("\n9️⃣  Verifying Final Balance...")
        resp = await client.get("/purchases/my-bottles", headers=headers)
        data = resp.json()
        my_bottles = data['bottles']
        updated_bottle = next((b for b in my_bottles if b['id'] == purchase_id), 
            next((b for b in my_bottles if b['bottleId'] == purchase_id), None)
        )
        if not updated_bottle:
           print(f"DEBUG: my_bottles: {my_bottles}")
           print(f"DEBUG: purchase_id: {purchase_id}")
        
        expected_remaining = user_bottle['remainingMl'] - 60
        assert updated_bottle['remainingMl'] == expected_remaining, \
            f"Balance mismatch! Expected {expected_remaining}, got {updated_bottle['remainingMl']}"
        print(f"   Balance updated correctly to {updated_bottle['remainingMl']}ml")
        
        print("\n✅✅✅ ALL TESTS PASSED SUCCESSFULLY! ✅✅✅")

if __name__ == "__main__":
    asyncio.run(run_test())
