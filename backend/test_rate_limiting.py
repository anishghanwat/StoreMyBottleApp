"""
Test script to verify rate limiting is working
Run this to test that rate limits are enforced
"""
import requests
import time

BASE_URL = "https://localhost:8000"

def test_login_rate_limit():
    """Test that login endpoint is rate limited to 5 attempts per minute"""
    print("\n🧪 Testing Login Rate Limiting (5 attempts/minute)...")
    
    # Make 6 login attempts (should fail on 6th)
    for i in range(6):
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": "test@example.com", "password": "wrongpassword"},
                verify=False  # Skip SSL verification for self-signed cert
            )
            print(f"  Attempt {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"  ✅ Rate limit triggered on attempt {i+1}")
                return True
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    
    print("  ❌ Rate limit NOT triggered after 6 attempts")
    return False


def test_signup_rate_limit():
    """Test that signup endpoint is rate limited to 3 attempts per hour"""
    print("\n🧪 Testing Signup Rate Limiting (3 attempts/hour)...")
    
    # Make 4 signup attempts (should fail on 4th)
    for i in range(4):
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/signup",
                json={
                    "email": f"test{i}@example.com",
                    "password": "TestPassword123!",
                    "name": "Test User"
                },
                verify=False
            )
            print(f"  Attempt {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"  ✅ Rate limit triggered on attempt {i+1}")
                return True
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    
    print("  ❌ Rate limit NOT triggered after 4 attempts")
    return False


def test_forgot_password_rate_limit():
    """Test that forgot-password endpoint is rate limited to 3 attempts per day"""
    print("\n🧪 Testing Forgot Password Rate Limiting (3 attempts/day)...")
    
    # Make 4 forgot password attempts (should fail on 4th)
    for i in range(4):
        try:
            response = requests.post(
                f"{BASE_URL}/api/auth/forgot-password",
                json={"email": "test@example.com"},
                verify=False
            )
            print(f"  Attempt {i+1}: Status {response.status_code}")
            
            if response.status_code == 429:
                print(f"  ✅ Rate limit triggered on attempt {i+1}")
                return True
        except Exception as e:
            print(f"  ❌ Error: {e}")
            return False
    
    print("  ❌ Rate limit NOT triggered after 4 attempts")
    return False


if __name__ == "__main__":
    print("=" * 60)
    print("🔒 RATE LIMITING TEST SUITE")
    print("=" * 60)
    print("\nMake sure the backend is running on https://localhost:8000")
    print("Press Enter to start tests...")
    input()
    
    # Disable SSL warnings for self-signed certificates
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    results = []
    
    # Test login rate limiting
    results.append(("Login", test_login_rate_limit()))
    time.sleep(2)
    
    # Test signup rate limiting
    results.append(("Signup", test_signup_rate_limit()))
    time.sleep(2)
    
    # Test forgot password rate limiting
    results.append(("Forgot Password", test_forgot_password_rate_limit()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    total_passed = sum(1 for _, passed in results if passed)
    print(f"\nTotal: {total_passed}/{len(results)} tests passed")
    print("=" * 60)
