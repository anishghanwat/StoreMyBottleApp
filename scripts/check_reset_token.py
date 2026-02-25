"""
Check if password reset token was created in database
"""

import sys
import os

# Load environment variables from backend/.env
from pathlib import Path
from dotenv import load_dotenv

backend_dir = Path(__file__).parent / 'backend'
env_path = backend_dir / '.env'
load_dotenv(env_path)

sys.path.append('backend')

from database import SessionLocal
from models import PasswordResetToken, User
from datetime import datetime

def check_reset_tokens():
    """Check all password reset tokens in database"""
    
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("PASSWORD RESET TOKENS IN DATABASE")
        print("=" * 60)
        print()
        
        # Get all tokens
        tokens = db.query(PasswordResetToken).all()
        
        if not tokens:
            print("No password reset tokens found in database.")
            print()
            print("This could mean:")
            print("1. No password reset has been requested yet")
            print("2. All tokens have expired and been cleaned up")
            print("3. The table exists but is empty")
            return
        
        print(f"Found {len(tokens)} token(s):\n")
        
        for token in tokens:
            user = db.query(User).filter(User.id == token.user_id).first()
            
            print(f"Token ID: {token.id}")
            print(f"User: {user.email if user else 'Unknown'}")
            print(f"Token: {token.token[:20]}...{token.token[-10:]}")
            print(f"Created: {token.created_at}")
            print(f"Expires: {token.expires_at}")
            print(f"Used: {token.is_used}")
            
            # Check if expired
            now = datetime.utcnow()
            if token.expires_at < now:
                print(f"Status: ❌ EXPIRED")
            elif token.is_used:
                print(f"Status: ❌ ALREADY USED")
            else:
                print(f"Status: ✅ VALID")
                print(f"\nTest this token at:")
                print(f"http://localhost:5173/reset-password?token={token.token}")
            
            print("-" * 60)
            print()
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

def get_latest_token_for_email(email):
    """Get the latest valid token for an email"""
    
    db = SessionLocal()
    
    try:
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            print(f"No user found with email: {email}")
            return
        
        token = db.query(PasswordResetToken)\
            .filter(PasswordResetToken.user_id == user.id)\
            .filter(PasswordResetToken.is_used == False)\
            .filter(PasswordResetToken.expires_at > datetime.utcnow())\
            .order_by(PasswordResetToken.created_at.desc())\
            .first()
        
        if not token:
            print(f"No valid token found for {email}")
            print("Request a new password reset.")
            return
        
        print("=" * 60)
        print(f"LATEST VALID TOKEN FOR {email}")
        print("=" * 60)
        print()
        print(f"Token: {token.token}")
        print(f"Created: {token.created_at}")
        print(f"Expires: {token.expires_at}")
        print()
        print("Test URL:")
        print(f"http://localhost:5173/reset-password?token={token.token}")
        print()
        print("Bartender URL:")
        print(f"http://localhost:5174/reset-password?token={token.token}")
        print()
        
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
        get_latest_token_for_email(email)
    else:
        check_reset_tokens()
