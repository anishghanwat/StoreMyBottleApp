"""
Test Password Reset Flow
Tests the complete password reset functionality
"""

import requests
import json
from datetime import datetime

BASE_URL = "https://localhost:8000/api"

# Disable SSL warnings for local testing
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_password_reset_flow():
    """Test the complete password reset flow"""
    
    print("=" * 60)
    print("PASSWORD RESET FLOW TEST")
    print("=" * 60)
    print()
    
    # Test email
    test_email = "anishghanwat2003@gmail.com"
    
    # Step 1: Request password reset
    print("Step 1: Requesting password reset...")
    print(f"Email: {test_email}")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/forgot-password",
            json={"email": test_email},
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Password reset request successful!")
        else:
            print("❌ Password reset request failed!")
            return
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return
    
    print()
    print("-" * 60)
    print()
    
    # Step 2: Check backend console for token
    print("Step 2: Check backend console output")
    print("The reset token should be printed in the backend console.")
    print("Look for a line like:")
    print("  Password reset token for user@example.com: abc123...")
    print()
    print("Copy the token and test it with:")
    print(f"  POST {BASE_URL}/auth/verify-reset-token")
    print('  Body: {"token": "YOUR_TOKEN_HERE"}')
    
    print()
    print("-" * 60)
    print()
    
    # Step 3: Instructions for manual testing
    print("Step 3: Manual Testing Instructions")
    print()
    print("1. Copy the token from backend console")
    print("2. Navigate to: http://localhost:5173/reset-password?token=YOUR_TOKEN")
    print("3. Enter new password")
    print("4. Confirm password")
    print("5. Submit form")
    print("6. Try logging in with new password")
    
    print()
    print("=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

def test_verify_token(token):
    """Test token verification"""
    
    print()
    print("=" * 60)
    print("TOKEN VERIFICATION TEST")
    print("=" * 60)
    print()
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/verify-reset-token",
            json={"token": token},
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200 and response.json().get("valid"):
            print("✅ Token is valid!")
        else:
            print("❌ Token is invalid or expired!")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_reset_password(token, new_password):
    """Test password reset with token"""
    
    print()
    print("=" * 60)
    print("PASSWORD RESET TEST")
    print("=" * 60)
    print()
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/reset-password",
            json={"token": token, "new_password": new_password},
            verify=False
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code == 200:
            print("✅ Password reset successful!")
        else:
            print("❌ Password reset failed!")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "verify" and len(sys.argv) > 2:
            token = sys.argv[2]
            test_verify_token(token)
        elif command == "reset" and len(sys.argv) > 3:
            token = sys.argv[2]
            new_password = sys.argv[3]
            test_reset_password(token, new_password)
        else:
            print("Usage:")
            print("  python test_password_reset.py                    # Request reset")
            print("  python test_password_reset.py verify TOKEN       # Verify token")
            print("  python test_password_reset.py reset TOKEN PASS   # Reset password")
    else:
        test_password_reset_flow()
