#!/usr/bin/env python3
"""
Test script for token refresh mechanism
Tests that tokens are properly refreshed before expiration
"""

import requests
import time
import json
from datetime import datetime

# Configuration
BASE_URL = "https://localhost:8000/api"
TEST_EMAIL = "admin@storemybottle.com"
TEST_PASSWORD = "admin123"

# Disable SSL warnings for self-signed cert
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def test_login():
    """Test login and get tokens"""
    print_section("TEST 1: Login and Get Tokens")
    
    response = requests.post(
        f"{BASE_URL}/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        verify=False
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login successful")
        print(f"   Access Token: {data['access_token'][:50]}...")
        print(f"   Refresh Token: {data['refresh_token'][:50] if data.get('refresh_token') else 'None'}...")
        print(f"   User: {data['user']['name']} ({data['user']['email']})")
        print(f"   Role: {data['user']['role']}")
        return data
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_protected_endpoint(access_token):
    """Test accessing protected endpoint with access token"""
    print_section("TEST 2: Access Protected Endpoint")
    
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
        verify=False
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Protected endpoint accessible")
        print(f"   User: {data['name']} ({data['email']})")
        return True
    else:
        print(f"❌ Protected endpoint failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return False

def test_refresh_token(refresh_token):
    """Test refreshing access token"""
    print_section("TEST 3: Refresh Access Token")
    
    response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token},
        verify=False
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Token refresh successful")
        print(f"   New Access Token: {data['access_token'][:50]}...")
        print(f"   New Refresh Token: {data['refresh_token'][:50] if data.get('refresh_token') else 'None'}...")
        return data
    else:
        print(f"❌ Token refresh failed: {response.status_code}")
        print(f"   Error: {response.text}")
        return None

def test_expired_token():
    """Test that expired tokens are rejected"""
    print_section("TEST 4: Expired Token Rejection")
    
    # Use an obviously expired/invalid token
    expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid"
    
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
        verify=False
    )
    
    if response.status_code == 401:
        print(f"✅ Expired token correctly rejected")
        print(f"   Status: {response.status_code}")
        return True
    else:
        print(f"❌ Expired token not rejected: {response.status_code}")
        return False

def test_session_management(refresh_token):
    """Test session management endpoints"""
    print_section("TEST 5: Session Management")
    
    # Get new access token first
    refresh_response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token},
        verify=False
    )
    
    if refresh_response.status_code != 200:
        print(f"❌ Could not refresh token for session test")
        return False
    
    access_token = refresh_response.json()['access_token']
    
    # Get active sessions
    response = requests.get(
        f"{BASE_URL}/auth/sessions",
        headers={"Authorization": f"Bearer {access_token}"},
        verify=False
    )
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Session management working")
        print(f"   Active Sessions: {data['total']}")
        if data['sessions']:
            session = data['sessions'][0]
            print(f"   Latest Session:")
            print(f"     - ID: {session['id']}")
            print(f"     - Created: {session['created_at']}")
            print(f"     - Last Activity: {session['last_activity']}")
            print(f"     - Expires: {session['expires_at']}")
        return True
    else:
        print(f"❌ Session management failed: {response.status_code}")
        return False

def test_logout(refresh_token):
    """Test logout functionality"""
    print_section("TEST 6: Logout")
    
    response = requests.post(
        f"{BASE_URL}/auth/logout",
        json={"refresh_token": refresh_token},
        verify=False
    )
    
    if response.status_code == 200:
        print(f"✅ Logout successful")
        
        # Try to use the refresh token again (should fail)
        refresh_response = requests.post(
            f"{BASE_URL}/auth/refresh",
            json={"refresh_token": refresh_token},
            verify=False
        )
        
        if refresh_response.status_code == 401:
            print(f"✅ Refresh token invalidated after logout")
            return True
        else:
            print(f"⚠️  Refresh token still works after logout (unexpected)")
            return False
    else:
        print(f"❌ Logout failed: {response.status_code}")
        return False

def main():
    print("\n" + "="*60)
    print("  TOKEN REFRESH MECHANISM TEST SUITE")
    print("="*60)
    print(f"\nTesting against: {BASE_URL}")
    print(f"Test User: {TEST_EMAIL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        "passed": 0,
        "failed": 0,
        "total": 6
    }
    
    # Test 1: Login
    login_data = test_login()
    if login_data and login_data.get('refresh_token'):
        results["passed"] += 1
        access_token = login_data['access_token']
        refresh_token = login_data['refresh_token']
    else:
        results["failed"] += 1
        print("\n❌ Cannot continue without valid login")
        return
    
    # Test 2: Protected endpoint
    if test_protected_endpoint(access_token):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 3: Refresh token
    refresh_data = test_refresh_token(refresh_token)
    if refresh_data:
        results["passed"] += 1
        # Update tokens for next tests
        access_token = refresh_data['access_token']
        refresh_token = refresh_data['refresh_token']
    else:
        results["failed"] += 1
    
    # Test 4: Expired token
    if test_expired_token():
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 5: Session management
    if test_session_management(refresh_token):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Test 6: Logout
    if test_logout(refresh_token):
        results["passed"] += 1
    else:
        results["failed"] += 1
    
    # Summary
    print_section("TEST SUMMARY")
    print(f"Total Tests: {results['total']}")
    print(f"✅ Passed: {results['passed']}")
    print(f"❌ Failed: {results['failed']}")
    print(f"Success Rate: {(results['passed']/results['total'])*100:.1f}%")
    
    if results['failed'] == 0:
        print("\n🎉 All tests passed! Token refresh mechanism is working correctly.")
    else:
        print(f"\n⚠️  {results['failed']} test(s) failed. Please review the output above.")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
