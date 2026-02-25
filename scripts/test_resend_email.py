"""
Test Resend Email Integration
Sends a test password reset email
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent / 'backend'
env_path = backend_dir / '.env'
load_dotenv(env_path)

sys.path.append('backend')

from auth import send_password_reset_email

def test_send_email():
    """Test sending a password reset email"""
    
    print("=" * 60)
    print("TESTING RESEND EMAIL INTEGRATION")
    print("=" * 60)
    print()
    
    # Test data
    test_email = input("Enter your email to receive test: ").strip()
    if not test_email:
        test_email = "anishghanwat2003@gmail.com"
    
    test_name = "Test User"
    test_token = "test_token_12345_this_is_a_sample_token"
    
    print(f"\nSending test email to: {test_email}")
    print(f"User name: {test_name}")
    print(f"Token: {test_token}")
    print()
    
    # Send email
    try:
        success = send_password_reset_email(test_email, test_token, test_name)
        
        if success:
            print("✅ Email sent successfully!")
            print()
            print("Check your inbox for the password reset email.")
            print("It should arrive within a few seconds.")
            print()
            print("If you don't see it:")
            print("1. Check your spam/junk folder")
            print("2. Wait a minute and refresh")
            print("3. Check the email address is correct")
        else:
            print("❌ Failed to send email")
            print("Check the error messages above")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    print()
    print("=" * 60)

if __name__ == "__main__":
    test_send_email()
