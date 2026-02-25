#!/usr/bin/env python3
"""
End-to-End Testing Script for StoreMyBottle
Tests all three user flows: Customer, Bartender, Admin
"""

import requests
import json
import time
from datetime import datetime
import urllib3

# Disable SSL warnings for self-signed certificates
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Configuration
BASE_URL = "https://localhost:8000"
CUSTOMER_FRONTEND = "http://localhost:5173"
BARTENDER_FRONTEND = "http://localhost:5174"

# Test results storage
test_results = {
    "customer_flow": [],
    "bartender_flow": [],
    "admin_flow": [],
    "edge_cases": [],
    "bugs_found": []
}

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log_test(test_name, status, message=""):
    """Log test result"""
    symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⚠️"
    color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{symbol} {color}{test_name}{Colors.END}: {message}")
    return {"test": test_name, "status": status, "message": message, "timestamp": datetime.now().isoformat()}

def test_health_check():
    """Test backend health"""
    print(f"\n{Colors.BLUE}=== Testing Backend Health ==={Colors.END}")
    try:
        response = requests.get(f"{BASE_URL}/health", verify=False, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return log_test("Backend Health Check", "PASS", f"Service: {data.get('service')}, Version: {data.get('version')}")
        else:
            return log_test("Backend Health Check", "FAIL", f"Status code: {response.status_code}")
    except Exception as e:
        return log_test("Backend Health Check", "FAIL", str(e))

def test_customer_auth():
    """Test customer authentication flow"""
    print(f"\n{Colors.BLUE}=== Testing Customer Authentication ==={Colors.END}")
    results = []
    
    # Test 1: Send OTP
    phone = "+919876543210"
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/phone/send-otp",
            json={"phone": phone},
            verify=False,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            otp = data.get("debug_otp", "123456")  # Get debug OTP in dev mode
            results.append(log_test("Send OTP", "PASS", f"OTP: {otp}"))
            
            # Test 2: Verify OTP
            time.sleep(1)
            response = requests.post(
                f"{BASE_URL}/api/auth/phone/verify-otp",
                json={"phone": phone, "otp_code": otp},
                verify=False,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                access_token = data.get("access_token")
                user = data.get("user")
                results.append(log_test("Verify OTP", "PASS", f"User: {user.get('name')}"))
                return results, access_token, user
            else:
                results.append(log_test("Verify OTP", "FAIL", f"Status: {response.status_code}"))
                return results, None, None
        else:
            results.append(log_test("Send OTP", "FAIL", f"Status: {response.status_code}"))
            return results, None, None
    except Exception as e:
        results.append(log_test("Customer Auth", "FAIL", str(e)))
        return results, None, None

def test_venue_listing(token):
    """Test venue listing"""
    print(f"\n{Colors.BLUE}=== Testing Venue Listing ==={Colors.END}")
    results = []
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/venues",
            headers={"Authorization": f"Bearer {token}"} if token else {},
            verify=False,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            venues = data.get("venues", [])
            results.append(log_test("Get Venues", "PASS", f"Found {len(venues)} venues"))
            return results, venues
        else:
            results.append(log_test("Get Venues", "FAIL", f"Status: {response.status_code}"))
            return results, []
    except Exception as e:
        results.append(log_test("Get Venues", "FAIL", str(e)))
        return results, []

def test_bottle_menu(venue_id, token):
    """Test bottle menu for a venue"""
    print(f"\n{Colors.BLUE}=== Testing Bottle Menu ==={Colors.END}")
    results = []
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/venues/{venue_id}/bottles",
            headers={"Authorization": f"Bearer {token}"} if token else {},
            verify=False,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            bottles = data.get("bottles", [])
            results.append(log_test("Get Bottle Menu", "PASS", f"Found {len(bottles)} bottles"))
            return results, bottles
        else:
            results.append(log_test("Get Bottle Menu", "FAIL", f"Status: {response.status_code}"))
            return results, []
    except Exception as e:
        results.append(log_test("Get Bottle Menu", "FAIL", str(e)))
        return results, []

def test_purchase_flow(venue_id, bottle_id, token):
    """Test bottle purchase"""
    print(f"\n{Colors.BLUE}=== Testing Purchase Flow ==={Colors.END}")
    results = []
    
    try:
        # Step 1: Create purchase
        purchase_data = {
            "venue_id": venue_id,
            "bottle_id": bottle_id,
            "payment_method": "upi",
            "idempotency_key": f"test-{int(time.time())}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/purchases",
            json=purchase_data,
            headers={"Authorization": f"Bearer {token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            purchase = response.json()  # Response is the purchase object directly
            purchase_id = purchase.get('id')
            results.append(log_test("Create Purchase", "PASS", f"Purchase ID: {purchase_id}"))
            
            # Step 2: Confirm purchase
            time.sleep(0.5)
            confirm_response = requests.post(
                f"{BASE_URL}/api/purchases/{purchase_id}/confirm",
                json={"payment_method": "upi"},
                headers={"Authorization": f"Bearer {token}"},
                verify=False,
                timeout=10
            )
            
            if confirm_response.status_code == 200:
                confirmed_purchase = confirm_response.json()
                results.append(log_test("Confirm Purchase", "PASS", f"Status: {confirmed_purchase.get('payment_status')}"))
                return results, confirmed_purchase
            else:
                results.append(log_test("Confirm Purchase", "FAIL", f"Status: {confirm_response.status_code}"))
                return results, purchase
        else:
            results.append(log_test("Create Purchase", "FAIL", f"Status: {response.status_code}, Response: {response.text}"))
            return results, None
    except Exception as e:
        results.append(log_test("Create Purchase", "FAIL", str(e)))
        return results, None

def test_my_bottles(token):
    """Test getting user's bottles"""
    print(f"\n{Colors.BLUE}=== Testing My Bottles ==={Colors.END}")
    results = []
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/purchases/my-bottles",
            headers={"Authorization": f"Bearer {token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            bottles = data.get("bottles", [])
            results.append(log_test("Get My Bottles", "PASS", f"Found {len(bottles)} bottles"))
            return results, bottles
        else:
            results.append(log_test("Get My Bottles", "FAIL", f"Status: {response.status_code}"))
            return results, []
    except Exception as e:
        results.append(log_test("Get My Bottles", "FAIL", str(e)))
        return results, []

def test_qr_generation(purchase_id, token):
    """Test QR code generation"""
    print(f"\n{Colors.BLUE}=== Testing QR Code Generation ==={Colors.END}")
    results = []
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/redemptions/generate-qr",
            json={"purchase_id": purchase_id, "peg_size_ml": 30},
            headers={"Authorization": f"Bearer {token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            qr_token = data.get("qr_token")
            results.append(log_test("Generate QR Code", "PASS", f"QR Token: {qr_token[:20]}..."))
            return results, qr_token
        else:
            results.append(log_test("Generate QR Code", "FAIL", f"Status: {response.status_code}, Response: {response.text}"))
            return results, None
    except Exception as e:
        results.append(log_test("Generate QR Code", "FAIL", str(e)))
        return results, None

def test_bartender_auth():
    """Test bartender authentication"""
    print(f"\n{Colors.BLUE}=== Testing Bartender Authentication ==={Colors.END}")
    results = []
    
    # Try to login with test bartender credentials
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "bartender@example.com", "password": "password123"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            user = data.get("user")
            results.append(log_test("Bartender Login", "PASS", f"User: {user.get('name')}"))
            return results, access_token, user
        else:
            results.append(log_test("Bartender Login", "FAIL", f"Status: {response.status_code} - No test bartender found"))
            return results, None, None
    except Exception as e:
        results.append(log_test("Bartender Login", "FAIL", str(e)))
        return results, None, None

def test_qr_validation(qr_token, bartender_token):
    """Test QR code validation by bartender"""
    print(f"\n{Colors.BLUE}=== Testing QR Validation ==={Colors.END}")
    results = []
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/redemptions/validate",
            json={"qr_token": qr_token},
            headers={"Authorization": f"Bearer {bartender_token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            results.append(log_test("Validate QR Code", "PASS", f"Success: {data.get('success')}, Message: {data.get('message')}"))
            return results, data
        else:
            results.append(log_test("Validate QR Code", "FAIL", f"Status: {response.status_code}"))
            return results, None
    except Exception as e:
        results.append(log_test("Validate QR Code", "FAIL", str(e)))
        return results, None

def test_admin_auth():
    """Test admin authentication"""
    print(f"\n{Colors.BLUE}=== Testing Admin Authentication ==={Colors.END}")
    results = []
    
    # Try to login with admin credentials
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "admin@storemybottle.com", "password": "admin123"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            user = data.get("user")
            results.append(log_test("Admin Login", "PASS", f"User: {user.get('name')}"))
            return results, access_token, user
        else:
            results.append(log_test("Admin Login", "FAIL", f"Status: {response.status_code} - No admin user found"))
            return results, None, None
    except Exception as e:
        results.append(log_test("Admin Login", "FAIL", str(e)))
        return results, None, None


def test_admin_dashboard(admin_token):
    """Test admin dashboard stats"""
    print(f"\n{Colors.BLUE}=== Testing Admin Dashboard ==={Colors.END}")
    results = []
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/admin/stats",
            headers={"Authorization": f"Bearer {admin_token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            results.append(log_test("Get Dashboard Stats", "PASS", f"Total Revenue: ₹{data.get('total_revenue', 0)}"))
            return results, data
        else:
            results.append(log_test("Get Dashboard Stats", "FAIL", f"Status: {response.status_code}"))
            return results, None
    except Exception as e:
        results.append(log_test("Get Dashboard Stats", "FAIL", str(e)))
        return results, None


def test_edge_case_expired_qr(purchase_id, token):
    """Test expired QR code handling"""
    print(f"\n{Colors.BLUE}=== Testing Edge Case: Expired QR ==={Colors.END}")
    results = []
    
    # This would require manipulating time or waiting 15 minutes
    # For now, we'll just document that this needs manual testing
    results.append(log_test("Expired QR Test", "SKIP", "Requires time manipulation - manual test needed"))
    return results


def test_edge_case_insufficient_volume(token):
    """Test insufficient volume handling"""
    print(f"\n{Colors.BLUE}=== Testing Edge Case: Insufficient Volume ==={Colors.END}")
    results = []
    
    try:
        # Try to get a bottle with low volume
        response = requests.get(
            f"{BASE_URL}/api/purchases/my-bottles",
            headers={"Authorization": f"Bearer {token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            bottles = data.get("bottles", [])
            
            # Find a bottle with less than 60ml
            low_volume_bottle = None
            for bottle in bottles:
                if bottle.get("remainingMl", 0) < 60:
                    low_volume_bottle = bottle
                    break
            
            if low_volume_bottle:
                # Try to redeem 60ml from a bottle with less than 60ml
                qr_response = requests.post(
                    f"{BASE_URL}/api/redemptions/generate-qr",
                    json={"purchase_id": low_volume_bottle["id"], "peg_size_ml": 60},
                    headers={"Authorization": f"Bearer {token}"},
                    verify=False,
                    timeout=10
                )
                
                if qr_response.status_code == 400:
                    results.append(log_test("Insufficient Volume Test", "PASS", "Correctly rejected insufficient volume"))
                else:
                    results.append(log_test("Insufficient Volume Test", "FAIL", f"Expected 400, got {qr_response.status_code}"))
            else:
                results.append(log_test("Insufficient Volume Test", "SKIP", "No bottles with low volume found"))
        else:
            results.append(log_test("Insufficient Volume Test", "FAIL", f"Status: {response.status_code}"))
    except Exception as e:
        results.append(log_test("Insufficient Volume Test", "FAIL", str(e)))
    
    return results


def test_edge_case_invalid_inputs(token):
    """Test invalid input handling"""
    print(f"\n{Colors.BLUE}=== Testing Edge Case: Invalid Inputs ==={Colors.END}")
    results = []
    
    # Test 1: Invalid phone number
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/phone/send-otp",
            json={"phone": "invalid"},
            verify=False,
            timeout=10
        )
        
        if response.status_code in [400, 422]:
            results.append(log_test("Invalid Phone Number", "PASS", "Correctly rejected invalid phone"))
        else:
            results.append(log_test("Invalid Phone Number", "FAIL", f"Expected 400/422, got {response.status_code}"))
    except Exception as e:
        results.append(log_test("Invalid Phone Number", "FAIL", str(e)))
    
    # Test 2: Invalid peg size
    try:
        response = requests.get(
            f"{BASE_URL}/api/purchases/my-bottles",
            headers={"Authorization": f"Bearer {token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            bottles = data.get("bottles", [])
            
            if bottles:
                # Try invalid peg size (100ml)
                qr_response = requests.post(
                    f"{BASE_URL}/api/redemptions/generate-qr",
                    json={"purchase_id": bottles[0]["id"], "peg_size_ml": 100},
                    headers={"Authorization": f"Bearer {token}"},
                    verify=False,
                    timeout=10
                )
                
                if qr_response.status_code in [400, 422]:
                    results.append(log_test("Invalid Peg Size", "PASS", "Correctly rejected invalid peg size"))
                else:
                    results.append(log_test("Invalid Peg Size", "FAIL", f"Expected 400/422, got {qr_response.status_code}"))
    except Exception as e:
        results.append(log_test("Invalid Peg Size", "FAIL", str(e)))
    
    return results


def test_edge_case_double_redemption(qr_token, bartender_token):
    """Test double redemption prevention"""
    print(f"\n{Colors.BLUE}=== Testing Edge Case: Double Redemption ==={Colors.END}")
    results = []
    
    try:
        # Try to redeem the same QR code again
        response = requests.post(
            f"{BASE_URL}/api/redemptions/validate",
            json={"qr_token": qr_token},
            headers={"Authorization": f"Bearer {bartender_token}"},
            verify=False,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if not data.get("success"):
                results.append(log_test("Double Redemption Prevention", "PASS", f"Correctly prevented: {data.get('message')}"))
            else:
                results.append(log_test("Double Redemption Prevention", "FAIL", "Should have rejected already used QR"))
        else:
            results.append(log_test("Double Redemption Prevention", "FAIL", f"Status: {response.status_code}"))
    except Exception as e:
        results.append(log_test("Double Redemption Prevention", "FAIL", str(e)))
    
    return results


def run_all_tests():
    """Run all E2E tests"""
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  StoreMyBottle - End-to-End Testing")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}{Colors.END}\n")
    
    # Test backend health
    result = test_health_check()
    test_results["customer_flow"].append(result)
    
    # Customer Flow
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  CUSTOMER FLOW TESTING")
    print(f"{'='*60}{Colors.END}")
    
    # 1. Authentication
    auth_results, customer_token, customer_user = test_customer_auth()
    test_results["customer_flow"].extend(auth_results)
    
    if not customer_token:
        print(f"\n{Colors.RED}❌ Customer authentication failed. Stopping customer flow tests.{Colors.END}")
    else:
        # 2. Venue Listing
        venue_results, venues = test_venue_listing(customer_token)
        test_results["customer_flow"].extend(venue_results)
        
        if venues:
            # 3. Bottle Menu
            venue_id = venues[0]["id"]
            bottle_results, bottles = test_bottle_menu(venue_id, customer_token)
            test_results["customer_flow"].extend(bottle_results)
            
            if bottles:
                # 4. Purchase
                bottle_id = bottles[0]["id"]
                purchase_results, purchase = test_purchase_flow(venue_id, bottle_id, customer_token)
                test_results["customer_flow"].extend(purchase_results)
                
                if purchase:
                    # 5. My Bottles
                    my_bottles_results, my_bottles = test_my_bottles(customer_token)
                    test_results["customer_flow"].extend(my_bottles_results)
                    
                    # 6. QR Generation
                    qr_results, qr_token = test_qr_generation(purchase["id"], customer_token)
                    test_results["customer_flow"].extend(qr_results)
                    
                    # Bartender Flow
                    if qr_token:
                        print(f"\n{Colors.YELLOW}{'='*60}")
                        print(f"  BARTENDER FLOW TESTING")
                        print(f"{'='*60}{Colors.END}")
                        
                        # 1. Bartender Auth
                        bartender_auth_results, bartender_token, bartender_user = test_bartender_auth()
                        test_results["bartender_flow"].extend(bartender_auth_results)
                        
                        if bartender_token:
                            # 2. QR Validation
                            validation_results, validation_data = test_qr_validation(qr_token, bartender_token)
                            test_results["bartender_flow"].extend(validation_results)
                            
                            # Edge Cases
                            print(f"\n{Colors.YELLOW}{'='*60}")
                            print(f"  EDGE CASES TESTING")
                            print(f"{'='*60}{Colors.END}")
                            
                            # Test double redemption
                            double_redemption_results = test_edge_case_double_redemption(qr_token, bartender_token)
                            test_results["edge_cases"].extend(double_redemption_results)
                            
                            # Test insufficient volume
                            insufficient_volume_results = test_edge_case_insufficient_volume(customer_token)
                            test_results["edge_cases"].extend(insufficient_volume_results)
                            
                            # Test invalid inputs
                            invalid_inputs_results = test_edge_case_invalid_inputs(customer_token)
                            test_results["edge_cases"].extend(invalid_inputs_results)
    
    # Admin Flow
    print(f"\n{Colors.YELLOW}{'='*60}")
    print(f"  ADMIN FLOW TESTING")
    print(f"{'='*60}{Colors.END}")
    
    admin_auth_results, admin_token, admin_user = test_admin_auth()
    test_results["admin_flow"].extend(admin_auth_results)
    
    if admin_token:
        dashboard_results, dashboard_data = test_admin_dashboard(admin_token)
        test_results["admin_flow"].extend(dashboard_results)
    
    # Print Summary
    print(f"\n{Colors.BLUE}{'='*60}")
    print(f"  TEST SUMMARY")
    print(f"{'='*60}{Colors.END}\n")
    
    total_tests = 0
    passed_tests = 0
    failed_tests = 0
    
    for flow_name, flow_results in test_results.items():
        if flow_results:
            print(f"\n{Colors.YELLOW}{flow_name.upper().replace('_', ' ')}:{Colors.END}")
            for result in flow_results:
                total_tests += 1
                if result["status"] == "PASS":
                    passed_tests += 1
                elif result["status"] == "FAIL":
                    failed_tests += 1
    
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"Total Tests: {total_tests}")
    print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.END}")
    print(f"{Colors.RED}Failed: {failed_tests}{Colors.END}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "N/A")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")
    
    return test_results

if __name__ == "__main__":
    results = run_all_tests()
    
    # Save results to file
    with open("e2e_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"📄 Detailed results saved to: e2e_test_results.json")
