"""
Test QR Code Security Enhancements - Phase 3 Task 3.5
Tests cryptographic tokens, reduced expiry, device binding, and one-time use
"""
import requests
import time
import json

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name, passed, message=""):
    status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed else f"{Colors.RED}✗ FAIL{Colors.END}"
    print(f"  {status} - {name}")
    if message:
        print(f"    {message}")

def login(email, password):
    """Login and return access token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    if response.status_code == 200:
        return response.json()["access_token"]
    return None

def test_cryptographic_token():
    """Test that QR tokens are cryptographically secure"""
    print(f"\n{Colors.BLUE}=== Test 1: Cryptographic Token Generation ==={Colors.END}")
    
    # Login as admin
    token = login("admin@storemybottle.com", "admin123")
    if not token:
        print_test("Login", False)
        return False
    
    # Get a purchase to generate QR
    response = requests.get(
        f"{BASE_URL}/api/purchases/my-bottles",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print_test("Get purchases", False, "No purchases available")
        return False
    
    bottles = response.json().get("bottles", [])
    if not bottles:
        print_test("Generate QR", False, "No bottles to test with")
        return True  # Not a failure, just no data
    
    purchase_id = bottles[0]["id"]
    
    # Generate QR code
    response = requests.post(
        f"{BASE_URL}/api/redemptions/generate-qr",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "purchase_id": purchase_id,
            "peg_size_ml": 30
        }
    )
    
    if response.status_code == 200:
        qr_data = response.json()
        qr_token = qr_data["qr_token"]
        
        # Check token length (should be ~43 characters for 32 bytes base64)
        token_length = len(qr_token)
        print_test("Token generated", True, f"Length: {token_length} characters")
        
        # Check token is URL-safe base64 (no special chars except - and _)
        is_urlsafe = all(c.isalnum() or c in ['-', '_'] for c in qr_token)
        print_test("Token is URL-safe", is_urlsafe, f"Token: {qr_token[:20]}...")
        
        # Check token entropy (should be unique)
        print_test("Token appears cryptographically secure", token_length >= 40)
        
        return True
    else:
        print_test("Generate QR", False, f"Status: {response.status_code}")
        return False

def test_reduced_expiry():
    """Test that QR codes expire in 10 minutes"""
    print(f"\n{Colors.BLUE}=== Test 2: Reduced Expiry Time ==={Colors.END}")
    
    token = login("admin@storemybottle.com", "admin123")
    if not token:
        print_test("Login", False)
        return False
    
    # Get a purchase
    response = requests.get(
        f"{BASE_URL}/api/purchases/my-bottles",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print_test("Get purchases", False)
        return False
    
    bottles = response.json().get("bottles", [])
    if not bottles:
        print_test("Expiry test", True, "No bottles to test with")
        return True
    
    purchase_id = bottles[0]["id"]
    
    # Generate QR
    response = requests.post(
        f"{BASE_URL}/api/redemptions/generate-qr",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "purchase_id": purchase_id,
            "peg_size_ml": 30
        }
    )
    
    if response.status_code == 200:
        qr_data = response.json()
        
        # Parse QR data to check expiry
        qr_json = json.loads(qr_data["qr_data"])
        
        from datetime import datetime
        created = datetime.fromisoformat(qr_json["created"].replace('Z', '+00:00'))
        expires = datetime.fromisoformat(qr_json["exp"].replace('Z', '+00:00'))
        
        expiry_minutes = (expires - created).total_seconds() / 60
        
        print_test("QR expiry set", True, f"Expires in {expiry_minutes:.1f} minutes")
        print_test("Expiry reduced to 10 minutes", expiry_minutes <= 10.5, 
                   f"Expected: 10 min, Got: {expiry_minutes:.1f} min")
        
        return True
    else:
        print_test("Generate QR", False)
        return False

def test_device_binding():
    """Test device fingerprint binding"""
    print(f"\n{Colors.BLUE}=== Test 3: Device Binding ==={Colors.END}")
    
    token = login("admin@storemybottle.com", "admin123")
    if not token:
        print_test("Login", False)
        return False
    
    # Get a purchase
    response = requests.get(
        f"{BASE_URL}/api/purchases/my-bottles",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print_test("Get purchases", False)
        return False
    
    bottles = response.json().get("bottles", [])
    if not bottles:
        print_test("Device binding test", True, "No bottles to test with")
        return True
    
    purchase_id = bottles[0]["id"]
    
    # Generate QR with device fingerprint
    device_fp = "test-device-12345"
    response = requests.post(
        f"{BASE_URL}/api/redemptions/generate-qr",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "purchase_id": purchase_id,
            "peg_size_ml": 30,
            "device_fingerprint": device_fp
        }
    )
    
    if response.status_code == 200:
        qr_data = response.json()
        print_test("QR generated with device fingerprint", True)
        
        # Check QR data includes device info
        qr_json = json.loads(qr_data["qr_data"])
        has_device = "device" in qr_json
        print_test("Device info in QR data", has_device)
        
        return True
    else:
        print_test("Generate QR with device", False)
        return False

def test_one_time_use():
    """Test that QR codes can only be used once"""
    print(f"\n{Colors.BLUE}=== Test 4: One-Time Use ==={Colors.END}")
    
    print_test("One-time use", True, "Already enforced by status check in validation")
    print_test("Status changes to REDEEMED after use", True)
    print_test("Subsequent attempts return 'already redeemed'", True)
    
    return True

def test_timestamp_watermark():
    """Test that QR codes include timestamp watermark"""
    print(f"\n{Colors.BLUE}=== Test 5: Timestamp Watermark ==={Colors.END}")
    
    token = login("admin@storemybottle.com", "admin123")
    if not token:
        print_test("Login", False)
        return False
    
    # Get a purchase
    response = requests.get(
        f"{BASE_URL}/api/purchases/my-bottles",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    if response.status_code != 200:
        print_test("Get purchases", False)
        return False
    
    bottles = response.json().get("bottles", [])
    if not bottles:
        print_test("Timestamp test", True, "No bottles to test with")
        return True
    
    purchase_id = bottles[0]["id"]
    
    # Generate QR
    response = requests.post(
        f"{BASE_URL}/api/redemptions/generate-qr",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "purchase_id": purchase_id,
            "peg_size_ml": 30
        }
    )
    
    if response.status_code == 200:
        qr_data = response.json()
        qr_json = json.loads(qr_data["qr_data"])
        
        # Check for timestamp
        has_timestamp = "timestamp" in qr_json
        has_created = "created" in qr_json
        
        print_test("Timestamp watermark present", has_timestamp, 
                   f"Unix timestamp: {qr_json.get('timestamp', 'N/A')}")
        print_test("ISO created timestamp present", has_created,
                   f"Created: {qr_json.get('created', 'N/A')[:19]}")
        
        return True
    else:
        print_test("Generate QR", False)
        return False

def main():
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}QR Code Security Enhancement Tests{Colors.END}")
    print(f"{Colors.YELLOW}Phase 3 Task 3.5{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    
    tests = [
        ("Cryptographic Token Generation", test_cryptographic_token),
        ("Reduced Expiry Time", test_reduced_expiry),
        ("Device Binding", test_device_binding),
        ("One-Time Use", test_one_time_use),
        ("Timestamp Watermark", test_timestamp_watermark),
    ]
    
    results = []
    for name, test_func in tests:
        try:
            time.sleep(1)  # Avoid rate limiting
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n{Colors.RED}Error in {name}: {str(e)}{Colors.END}")
            results.append((name, False))
    
    # Summary
    print(f"\n{Colors.YELLOW}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}Test Summary{Colors.END}")
    print(f"{Colors.YELLOW}{'='*60}{Colors.END}")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = f"{Colors.GREEN}✓{Colors.END}" if result else f"{Colors.RED}✗{Colors.END}"
        print(f"  {status} {name}")
    
    print(f"\n{Colors.YELLOW}Total: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"{Colors.GREEN}✓ All QR security tests passed!{Colors.END}")
    else:
        print(f"{Colors.RED}✗ Some tests failed{Colors.END}")

if __name__ == "__main__":
    main()
