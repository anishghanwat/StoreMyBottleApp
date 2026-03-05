"""
Test script to verify HttpOnly cookie implementation
Tests login, authenticated requests, and logout with cookies
"""
import requests
import json
from requests.packages.urllib3.exceptions import InsecureRequestWarning

# Disable SSL warnings for testing
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)

BASE_URL = "http://localhost:8000"

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_cookies(response):
    """Print cookies from response"""
    if response.cookies:
        print("\n📦 Cookies Set:")
        for cookie in response.cookies:
            print(f"  - {cookie.name}: {cookie.value[:20]}...")
            print(f"    Path: {cookie.path}")
            print(f"    Secure: {cookie.secure}")
            print(f"    HttpOnly: {cookie.has_nonstandard_attr('HttpOnly')}")
    else:
        print("\n📦 No cookies set")

def test_login_with_cookies():
    """Test 1: Login and verify cookies are set"""
    print_section("TEST 1: Login with Cookie Support")
    
    # Create a session to persist cookies
    session = requests.Session()
    
    # Login
    login_data = {
        "email": "admin@storemybottle.com",
        "password": "admin123"
    }
    
    print(f"\n🔐 Logging in as: {login_data['email']}")
    
    try:
        response = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_data,
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Login successful!")
            
            # Check response body
            data = response.json()
            print(f"\n📄 Response Body:")
            print(f"  - User: {data['user']['name']}")
            print(f"  - Role: {data['user']['role']}")
            print(f"  - Access Token: {data['access_token'][:20]}...")
            print(f"  - Refresh Token: {data['refresh_token'][:20]}...")
            
            # Check cookies
            print_cookies(response)
            
            # Verify cookies are in session
            if 'access_token' in session.cookies:
                print("\n✅ access_token cookie is set in session")
            else:
                print("\n❌ access_token cookie NOT found in session")
            
            if 'refresh_token' in session.cookies:
                print("✅ refresh_token cookie is set in session")
            else:
                print("❌ refresh_token cookie NOT found in session")
            
            return session
        else:
            print(f"❌ Login failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None


def test_authenticated_request(session):
    """Test 2: Make authenticated request using cookies"""
    print_section("TEST 2: Authenticated Request with Cookies")
    
    if not session:
        print("❌ No session available (login failed)")
        return False
    
    print("\n🔍 Fetching user profile using cookies...")
    
    try:
        response = session.get(
            f"{BASE_URL}/api/profile",
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Authenticated request successful!")
            print(f"\n📄 Profile Data:")
            print(f"  - Name: {data['user']['name']}")
            print(f"  - Email: {data['user']['email']}")
            print(f"  - Total Bottles: {data['total_bottles']}")
            return True
        else:
            print(f"❌ Request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_refresh_token(session):
    """Test 3: Refresh access token and verify new cookies"""
    print_section("TEST 3: Refresh Token with Cookies")
    
    if not session:
        print("❌ No session available")
        return False
    
    # Get current refresh token from cookie
    refresh_token = session.cookies.get('refresh_token')
    
    if not refresh_token:
        print("❌ No refresh_token cookie found")
        return False
    
    print(f"\n🔄 Refreshing token...")
    print(f"  Current refresh token: {refresh_token[:20]}...")
    
    try:
        response = session.post(
            f"{BASE_URL}/api/auth/refresh",
            json={"refresh_token": refresh_token},
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Token refresh successful!")
            
            # Check new tokens in response
            print(f"\n📄 New Tokens in Response:")
            print(f"  - New Access Token: {data['access_token'][:20]}...")
            print(f"  - New Refresh Token: {data['refresh_token'][:20]}...")
            
            # Check if cookies were updated
            print_cookies(response)
            
            # Verify new cookies in session
            new_access = session.cookies.get('access_token')
            new_refresh = session.cookies.get('refresh_token')
            
            if new_access:
                print(f"\n✅ New access_token cookie: {new_access[:20]}...")
            else:
                print("\n❌ access_token cookie not updated")
            
            if new_refresh:
                print(f"✅ New refresh_token cookie: {new_refresh[:20]}...")
            else:
                print("❌ refresh_token cookie not updated")
            
            return True
        else:
            print(f"❌ Refresh failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_logout(session):
    """Test 4: Logout and verify cookies are cleared"""
    print_section("TEST 4: Logout and Clear Cookies")
    
    if not session:
        print("❌ No session available")
        return False
    
    # Get refresh token for logout
    refresh_token = session.cookies.get('refresh_token')
    
    if not refresh_token:
        print("❌ No refresh_token cookie found")
        return False
    
    print(f"\n🚪 Logging out...")
    
    try:
        response = session.post(
            f"{BASE_URL}/api/auth/logout",
            json={"refresh_token": refresh_token},
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Logout successful!")
            
            # Check if cookies were cleared
            print_cookies(response)
            
            # Verify cookies are removed from session
            if 'access_token' not in session.cookies:
                print("\n✅ access_token cookie cleared")
            else:
                print("\n❌ access_token cookie still present")
            
            if 'refresh_token' not in session.cookies:
                print("✅ refresh_token cookie cleared")
            else:
                print("❌ refresh_token cookie still present")
            
            return True
        else:
            print(f"❌ Logout failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def test_request_after_logout(session):
    """Test 5: Verify authenticated requests fail after logout"""
    print_section("TEST 5: Request After Logout (Should Fail)")
    
    if not session:
        print("❌ No session available")
        return False
    
    print("\n🔍 Attempting authenticated request after logout...")
    
    try:
        response = session.get(
            f"{BASE_URL}/api/profile",
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 401:
            print("✅ Request correctly rejected (401 Unauthorized)")
            return True
        elif response.status_code == 200:
            print("❌ Request succeeded (should have failed!)")
            return False
        else:
            print(f"⚠️  Unexpected status: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("  🍪 HTTPONLY COOKIE IMPLEMENTATION TEST SUITE")
    print("="*70)
    print("\nTesting backend cookie support...")
    print(f"Base URL: {BASE_URL}")
    
    # Run tests
    session = test_login_with_cookies()
    
    if session:
        test_authenticated_request(session)
        test_refresh_token(session)
        test_logout(session)
        test_request_after_logout(session)
    
    # Summary
    print("\n" + "="*70)
    print("  📊 TEST SUMMARY")
    print("="*70)
    print("\nIf all tests passed:")
    print("  ✅ Login sets HttpOnly cookies")
    print("  ✅ Cookies work for authenticated requests")
    print("  ✅ Token refresh updates cookies")
    print("  ✅ Logout clears cookies")
    print("  ✅ Requests fail after logout")
    print("\n" + "="*70)


if __name__ == "__main__":
    main()
