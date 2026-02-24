from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from twilio.rest import Client as TwilioClient

from config import settings
from database import get_db
from models import User, OTP

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)

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
