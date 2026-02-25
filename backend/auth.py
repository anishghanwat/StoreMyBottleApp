from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from twilio.rest import Client as TwilioClient

from config import settings
from database import get_db
from models import User, OTP

# Password hashing and verification functions using bcrypt directly
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')[:72]  # Bcrypt 72 byte limit
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash using bcrypt"""
    try:
        password_bytes = plain_password.encode('utf-8')[:72]  # Bcrypt 72 byte limit
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    """Create a refresh token with longer expiration (7 days)"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_session(db: Session, user_id: str, access_token: str, refresh_token: str, 
                   device_info: str = None, ip_address: str = None, user_agent: str = None):
    """Create a new user session"""
    from models import UserSession
    
    # Calculate expiration (7 days for refresh token)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Create session
    session = UserSession(
        user_id=user_id,
        refresh_token=refresh_token,
        access_token=access_token,
        device_info=device_info,
        ip_address=ip_address,
        user_agent=user_agent,
        expires_at=expires_at
    )
    
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_session_by_refresh_token(db: Session, refresh_token: str):
    """Get active session by refresh token"""
    from models import UserSession
    
    session = db.query(UserSession).filter(
        UserSession.refresh_token == refresh_token,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).first()
    
    return session


def update_session_tokens(db: Session, session_id: str, new_access_token: str, new_refresh_token: str):
    """Update session with new tokens"""
    from models import UserSession
    
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if session:
        session.access_token = new_access_token
        session.refresh_token = new_refresh_token
        session.last_activity = datetime.utcnow()
        session.expires_at = datetime.utcnow() + timedelta(days=7)
        db.commit()
        db.refresh(session)
    return session


def invalidate_session(db: Session, refresh_token: str):
    """Invalidate a session (logout)"""
    from models import UserSession
    
    session = db.query(UserSession).filter(
        UserSession.refresh_token == refresh_token
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
    return session


def invalidate_all_user_sessions(db: Session, user_id: str):
    """Invalidate all sessions for a user (logout from all devices)"""
    from models import UserSession
    
    db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.is_active == True
    ).update({"is_active": False})
    db.commit()


def cleanup_expired_sessions(db: Session):
    """Clean up expired sessions (run periodically)"""
    from models import UserSession
    
    db.query(UserSession).filter(
        UserSession.expires_at < datetime.utcnow()
    ).update({"is_active": False})
    db.commit()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    # if not current_user.is_active: raise HTTPException...
    return current_user

async def get_current_active_bartender(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "bartender" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_active_admin(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user

def generate_qr_token() -> str:
    import uuid
    import base64
    # Generate a random UUID and encode it to look like a token
    token = str(uuid.uuid4())
    # Optionally base64 encode for shorter representation if desired, 
    # but UUID is fine. Let's make it a bit more "token-like"
    return base64.urlsafe_b64encode(uuid.uuid4().bytes).decode().rstrip("=")


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt - wrapper for compatibility"""
    return hash_password(password)

# ============ Google Auth ============

def verify_google_token(token: str) -> Optional[dict]:
    try:
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        return idinfo
    except ValueError:
        return None

# ============ Phone OTP ============

def create_otp(db: Session, phone: str) -> OTP:
    # Generate 6-digit OTP (for dev use 123456)
    code = "123456"
    if settings.ENVIRONMENT == "production":
        import random
        code = str(random.randint(100000, 999999))
        
    # Set expiration
    expires = datetime.utcnow() + timedelta(minutes=5)
    
    # Check existing unverified OTP
    existing_otp = db.query(OTP).filter(
        OTP.phone == phone, 
        OTP.is_verified == False,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if existing_otp:
        existing_otp.otp_code = code
        existing_otp.expires_at = expires
        db.commit()
        db.refresh(existing_otp)
        return existing_otp
        
    otp = OTP(phone=phone, otp_code=code, expires_at=expires)
    db.add(otp)
    db.commit()
    db.refresh(otp)
    return otp

def verify_otp(db: Session, phone: str, code: str) -> bool:
    otp = db.query(OTP).filter(
        OTP.phone == phone,
        OTP.otp_code == code,
        OTP.is_verified == False,
        OTP.expires_at > datetime.utcnow()
    ).first()
    
    if otp:
        otp.is_verified = True
        db.commit()
        return True
    return False

def send_otp_sms(phone: str, code: str) -> bool:
    if settings.ENVIRONMENT == "development":
        print(f"DEBUG OTP for {phone}: {code}")
        return True
        
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        print("Twilio not configured")
        return False
        
    try:
        client = TwilioClient(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        # client.messages.create(...)
        # Stub implementation for now
        return True
    except Exception as e:
        print(f"Twilio error: {e}")
        return False


# ============ Password Reset ============

def create_password_reset_token(db: Session, user_id: str) -> str:
    """Create a password reset token for a user"""
    from models import PasswordResetToken
    import secrets
    
    # Generate secure random token
    token = secrets.token_urlsafe(32)
    
    # Set expiration (1 hour)
    expires = datetime.utcnow() + timedelta(hours=1)
    
    # Invalidate any existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id,
        PasswordResetToken.is_used == False
    ).update({"is_used": True})
    
    # Create new token
    reset_token = PasswordResetToken(
        user_id=user_id,
        token=token,
        expires_at=expires
    )
    
    db.add(reset_token)
    db.commit()
    db.refresh(reset_token)
    
    return token


def verify_password_reset_token(db: Session, token: str) -> Optional[str]:
    """Verify password reset token and return user_id if valid"""
    from models import PasswordResetToken
    
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.utcnow()
    ).first()
    
    if reset_token:
        return reset_token.user_id
    return None


def use_password_reset_token(db: Session, token: str, new_password: str) -> bool:
    """Use password reset token to set new password"""
    from models import PasswordResetToken
    
    # Verify token
    user_id = verify_password_reset_token(db, token)
    if not user_id:
        return False
    
    # Get user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    
    # Mark token as used
    db.query(PasswordResetToken).filter(
        PasswordResetToken.token == token
    ).update({"is_used": True})
    
    db.commit()
    return True


def send_password_reset_email(email: str, token: str, user_name: str) -> bool:
    """Send password reset email using Resend"""
    
    # Build reset URL
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    # In development without Resend, print to console
    if settings.ENVIRONMENT == "development" and not settings.RESEND_API_KEY:
        print("\n" + "="*60)
        print("PASSWORD RESET EMAIL (Console Mode)")
        print("="*60)
        print(f"To: {email}")
        print(f"Name: {user_name}")
        print(f"Reset URL: {reset_url}")
        print(f"Token: {token}")
        print(f"Expires: 1 hour")
        print("="*60 + "\n")
        return True
    
    # Use Resend to send email
    if settings.RESEND_API_KEY:
        try:
            import resend
            resend.api_key = settings.RESEND_API_KEY
            
            # Create HTML email
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Reset Your Password</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">StoreMyBottle</h1>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                                        <p style="margin: 0 0 20px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                            Hi {user_name},
                                        </p>
                                        <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                            We received a request to reset your password. Click the button below to create a new password:
                                        </p>
                                        
                                        <!-- Button -->
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center" style="padding: 20px 0;">
                                                    <a href="{reset_url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                                                        Reset Password
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <p style="margin: 30px 0 20px; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                            Or copy and paste this link into your browser:
                                        </p>
                                        <p style="margin: 0 0 30px; padding: 12px; background-color: #f8f8f8; border-radius: 6px; color: #667eea; font-size: 13px; word-break: break-all;">
                                            {reset_url}
                                        </p>
                                        
                                        <p style="margin: 0 0 10px; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                            <strong>This link will expire in 1 hour.</strong>
                                        </p>
                                        <p style="margin: 0; color: #6a6a6a; font-size: 14px; line-height: 1.6;">
                                            If you didn't request a password reset, you can safely ignore this email.
                                        </p>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px 40px; background-color: #f8f8f8; border-radius: 0 0 12px 12px; text-align: center;">
                                        <p style="margin: 0 0 10px; color: #8a8a8a; font-size: 13px;">
                                            StoreMyBottle - Your Premium Bottle Storage Service
                                        </p>
                                        <p style="margin: 0; color: #8a8a8a; font-size: 12px;">
                                            © 2026 StoreMyBottle. All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """
            
            # Plain text version
            text_content = f"""
            Reset Your Password
            
            Hi {user_name},
            
            We received a request to reset your password. Click the link below to create a new password:
            
            {reset_url}
            
            This link will expire in 1 hour.
            
            If you didn't request a password reset, you can safely ignore this email.
            
            ---
            StoreMyBottle - Your Premium Bottle Storage Service
            © 2026 StoreMyBottle. All rights reserved.
            """
            
            # Send email
            params = {
                "from": settings.FROM_EMAIL,
                "to": [email],
                "subject": "Reset Your Password - StoreMyBottle",
                "html": html_content,
                "text": text_content,
            }
            
            response = resend.Emails.send(params)
            print(f"✅ Password reset email sent to {email} (ID: {response.get('id', 'unknown')})")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email via Resend: {str(e)}")
            # Fall back to console in development
            if settings.ENVIRONMENT == "development":
                print("\n" + "="*60)
                print("PASSWORD RESET EMAIL (Fallback - Resend Failed)")
                print("="*60)
                print(f"To: {email}")
                print(f"Name: {user_name}")
                print(f"Reset URL: {reset_url}")
                print(f"Token: {token}")
                print(f"Error: {str(e)}")
                print("="*60 + "\n")
                return True
            return False
    
    return False
