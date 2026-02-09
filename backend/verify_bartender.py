import requests
import json
import sys
import time

BASE_URL = "http://localhost:8000/api"
BARTENDER_EMAIL = "bartender@example.com"
BARTENDER_PASSWORD = "password123"

def print_step(step):
    print(f"\n{'='*50}\n{step}\n{'='*50}")

def verify_bartender_flow():
    # 1. Login as Bartender
    print_step("1. Logging in as Bartender")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": BARTENDER_EMAIL,
            "password": BARTENDER_PASSWORD
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        
        data = resp.json()
        token = data["access_token"]
        user = data["user"]
        print(f"Logged in as: {user['name']} ({user['role']})")
        print(f"Token: {token[:20]}...")
        
        if user["role"] != "bartender":
            print("ERROR: User is not a bartender!")
            return
            
    except Exception as e:
        print(f"Error logging in: {e}")
        return

    # 2. Need a valid QR Token. 
    # To get one, we need to be a customer, buy a bottle, generate QR.
    # This script should probably coordinate with verify_flow.py or just create one manually?
    # Let's create a customer and buy a bottle first (mock flow).
    print_step("2. Setting up Customer & Bottle")
    # We can reuse the customer from seed or create new
    # Let's try to login as 'test@example.com' (from verify_flow.py)
    # But verify_flow uses OTP.
    # We can use the 'seed_bartender.py' logic to create a customer if needed?
    # Actually, verify_flow.py created a user and bought a bottle.
    # I can try to run a snippet here to "simulate" existing customer purchase.
    
    # Or I can just manually insert a Purchase and Redemption into DB?
    # No, better to use API.
    
    # Let's use the 'verify_flow.py' user if possible, or create new.
    # verify_flow.py uses a random phone number.
    # Let's create a new customer via Signup (which I updated to use password!)
    customer_email = f"customer_{int(time.time())}@example.com"
    customer_pass = "customer123"
    
    print(f"Creating customer: {customer_email}")
    resp = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": customer_email, 
        "password": customer_pass,
        "name": "Test Customer"
    })
    if resp.status_code != 200:
        print(f"Signup failed: {resp.text}")
        return
    
    # Login as customer
    resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": customer_email,
        "password": customer_pass
    })
    customer_token = resp.json()["access_token"]
    
    # Get Venues
    resp = requests.get(f"{BASE_URL}/venues/", headers={"Authorization": f"Bearer {customer_token}"})
    venues = resp.json()["venues"]
    venue_id = venues[0]["id"]
    
    # Get Bottles
    resp = requests.get(f"{BASE_URL}/venues/{venue_id}/bottles", headers={"Authorization": f"Bearer {customer_token}"})
    bottles = resp.json()["bottles"]
    bottle_id = bottles[0]["id"]
    
    print(f"Buying bottle: {bottles[0]['name']} at {venues[0]['name']}")
    
    # Buy Bottle
    resp = requests.post(f"{BASE_URL}/purchases/", 
        json={"bottle_id": bottle_id, "venue_id": venue_id},
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    purchase_id = resp.json()["id"]
    
    # Confirm Payment
    resp = requests.post(f"{BASE_URL}/purchases/{purchase_id}/confirm",
        json={"payment_method": "upi"},
        headers={"Authorization": f"Bearer {customer_token}"}
    )
    
    # Generate QR
    print_step("3. Generating Redemption QR (Customer)")
    try:
        resp = requests.post(f"{BASE_URL}/redemptions/generate-qr",
            json={"purchase_id": purchase_id, "peg_size_ml": 45},
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        if resp.status_code != 200:
            print(f"Generate QR failed: {resp.text}")
            return
            
        redemption_data = resp.json()
        qr_token = redemption_data["qr_token"]
        print(f"Generated QR Token: {qr_token}")
        
    except Exception as e:
        print(f"Error generating QR: {e}")
        return

    # 4. Validate QR as Bartender
    print_step("4. Validating QR (Bartender)")
    try:
        resp = requests.post(f"{BASE_URL}/redemptions/validate",
            json={"qr_token": qr_token},
            headers={"Authorization": f"Bearer {token}"} # Bartender Token
        )
        
        print(f"Status Code: {resp.status_code}")
        print(f"Response: {resp.json()}")
        
        if resp.status_code == 200:
            data = resp.json()
            if data["success"]:
                print("✅ VALIDATION SUCCESSFUL")
                r = data["redemption"]
                print(f"Served: {r['peg_size_ml']}ml")
                print(f"Remaining: {r['remaining_ml']}ml / {r['total_ml']}ml")
            else:
                print("❌ VALIDATION FAILED (Logic Error)")
        else:
            print("❌ VALIDATION FAILED (API Error)")
            
    except Exception as e:
        print(f"Error validating QR: {e}")

if __name__ == "__main__":
    verify_bartender_flow()
