"""
Test script to verify password validation is working
Run this to test password strength requirements
"""
import requests
import json

BASE_URL = "https://localhost:8000"

# Test passwords with expected results
test_cases = [
    # (password, should_pass, description)
    ("weak", False, "Too short (< 8 chars)"),
    ("password", False, "No uppercase, no number, no special char"),
    ("password123", False, "Common password, no uppercase, no special char"),
    ("Password123", False, "No special character"),
    ("Password!", False, "No number"),
    ("Pass123!", False, "Too short (< 8 chars)"),
    ("PASSWORD123!", False, "No lowercase"),
    ("password123!", False, "No uppercase"),
    ("Passw0rd!", False, "Common password variant"),
    ("MyP@ssw0rd!", True, "Valid - meets all requirements"),
    ("Str0ng!Pass", True, "Valid - meets all requirements"),
    ("C0mpl3x#Pwd", True, "Valid - meets all requirements"),
    ("aaaaAAAA1!", False, "Repeated characters"),
    ("Abc123!@#", False, "Sequential characters (abc, 123)"),
    ("Admin@123", False, "Common password (admin)"),
]

def test_signup_password_validation():
    """Test password validation on signup endpoint"""
    print("\n" + "="*70)
    print("🔒 PASSWORD VALIDATION TEST - SIGNUP ENDPOINT")
    print("="*70)
    
    passed = 0
    failed = 0
    
    for password, should_pass, description in test_cases:
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/signup",
                json={
                    "email": f"test_{hash(password)}@example.com",
                    "password": password,
                    "name": "Test User"
                },
                verify=False
            )
            
            # Check if response matches expectation
            if should_pass:
                # Should succeed (200 or 201)
                if response.status_code in [200, 201]:
                    print(f"✅ PASS: '{password}' - {description}")
                    print(f"   Status: {response.status_code} (Accepted)")
                    passed += 1
                else:
                    print(f"❌ FAIL: '{password}' - {description}")
                    print(f"   Expected: Success, Got: {response.status_code}")
                    print(f"   Error: {response.json().get('detail', 'Unknown')}")
                    failed += 1
            else:
                # Should fail (400)
                if response.status_code == 400:
                    error_detail = response.json().get('detail', 'Unknown error')
                    print(f"✅ PASS: '{password}' - {description}")
                    print(f"   Rejected: {error_detail}")
                    passed += 1
                elif response.status_code == 429:
                    print(f"⚠️  SKIP: '{password}' - Rate limited")
                else:
                    print(f"❌ FAIL: '{password}' - {description}")
                    print(f"   Expected: 400, Got: {response.status_code}")
                    failed += 1
                    
        except Exception as e:
            print(f"❌ ERROR: '{password}' - {e}")
            failed += 1
        
        print()
    
    return passed, failed


def test_reset_password_validation():
    """Test password validation on reset password endpoint"""
    print("\n" + "="*70)
    print("🔒 PASSWORD VALIDATION TEST - RESET PASSWORD ENDPOINT")
    print("="*70)
    print("\nNote: Using invalid token, testing only password validation\n")
    
    passed = 0
    failed = 0
    
    # Test a few key cases
    key_tests = [
        ("weak", False, "Too short"),
        ("Password123", False, "No special character"),
        ("MyP@ssw0rd!", True, "Valid password"),
    ]
    
    for password, should_pass, description in key_tests:
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/reset-password",
                json={
                    "token": "invalid_token_for_testing",
                    "new_password": password
                },
                verify=False
            )
            
            # If password is invalid, should get 400 with password error
            # If password is valid, should get 400 with token error
            if response.status_code == 400:
                error_detail = response.json().get('detail', '')
                
                if should_pass:
                    # Valid password should fail on token, not password
                    if 'token' in error_detail.lower() or 'expired' in error_detail.lower():
                        print(f"✅ PASS: '{password}' - {description}")
                        print(f"   Password accepted, failed on token (expected)")
                        passed += 1
                    else:
                        print(f"❌ FAIL: '{password}' - {description}")
                        print(f"   Password rejected: {error_detail}")
                        failed += 1
                else:
                    # Invalid password should fail on password validation
                    if 'password' in error_detail.lower():
                        print(f"✅ PASS: '{password}' - {description}")
                        print(f"   Rejected: {error_detail}")
                        passed += 1
                    else:
                        print(f"❌ FAIL: '{password}' - {description}")
                        print(f"   Wrong error: {error_detail}")
                        failed += 1
            elif response.status_code == 429:
                print(f"⚠️  SKIP: '{password}' - Rate limited")
            else:
                print(f"❌ FAIL: '{password}' - Unexpected status {response.status_code}")
                failed += 1
                
        except Exception as e:
            print(f"❌ ERROR: '{password}' - {e}")
            failed += 1
        
        print()
    
    return passed, failed


if __name__ == "__main__":
    print("\n" + "="*70)
    print("🔐 PASSWORD STRENGTH VALIDATION TEST SUITE")
    print("="*70)
    print("\nMake sure the backend is running on https://localhost:8000")
    print("Press Enter to start tests...")
    input()
    
    # Disable SSL warnings for self-signed certificates
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # Run tests
    signup_passed, signup_failed = test_signup_password_validation()
    reset_passed, reset_failed = test_reset_password_validation()
    
    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    print(f"\nSignup Endpoint:")
    print(f"  ✅ Passed: {signup_passed}")
    print(f"  ❌ Failed: {signup_failed}")
    print(f"\nReset Password Endpoint:")
    print(f"  ✅ Passed: {reset_passed}")
    print(f"  ❌ Failed: {reset_failed}")
    print(f"\nTotal:")
    print(f"  ✅ Passed: {signup_passed + reset_passed}")
    print(f"  ❌ Failed: {signup_failed + reset_failed}")
    
    if signup_failed + reset_failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
    else:
        print("\n⚠️  SOME TESTS FAILED")
    
    print("="*70)
