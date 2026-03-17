from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from database import get_db
from config import settings
from models import User
from schemas import (
    LoginRequest, SignupRequest,
    GoogleLoginRequest, PhoneSendOTPRequest, PhoneVerifyOTPRequest,
    RefreshTokenRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ChangePasswordRequest, TokenResponse, UserResponse
)
from auth import (
    create_access_token, create_refresh_token, create_session, 
    get_session_by_refresh_token, update_session_tokens, invalidate_session,
    invalidate_all_user_sessions, verify_google_token, create_otp, verify_otp,
    send_otp_sms, get_current_user, hash_password, verify_password,
    create_password_reset_token, verify_password_reset_token, 
    use_password_reset_token, validate_password_strength
)
from email_service import send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/api/auth", tags=["authentication"])

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    """
    Set HttpOnly cookies for access and refresh tokens.
    This is more secure than localStorage as cookies cannot be accessed by JavaScript.
    """
    # Determine if we're in production (use Secure flag)
    is_production = settings.ENVIRONMENT == "production"
    
    # Set access token cookie (30 minutes)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,  # Cannot be accessed by JavaScript
        secure=is_production,  # HTTPS only in production
        samesite="lax",  # CSRF protection (lax allows navigation)
        max_age=1800,  # 30 minutes
        path="/"
    )
    
    # Set refresh token cookie (7 days)
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=604800,  # 7 days
        path="/"
    )


def clear_auth_cookies(response: Response):
    """Clear authentication cookies on logout"""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/")


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")  # 5 login attempts per minute per IP
def login(request_data: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """Login with email and password"""
    try:
        # Find user by email
        user = db.query(User).filter(User.email == request_data.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check password
        if not user.hashed_password or not verify_password(request_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token and refresh token
        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        
        access_token = create_access_token(data={
            "sub": user.id,
            "role": role_str,
            "venue_id": user.venue_id
        })
        
        refresh_token = create_refresh_token(data={
            "sub": user.id,
            "role": role_str
        })
        
        # Create session in database
        create_session(
            db=db,
            user_id=user.id,
            access_token=access_token,
            refresh_token=refresh_token
        )
        
        # Set HttpOnly cookies
        set_auth_cookies(response, access_token, refresh_token)
        
        # Get venue name if venue_id exists
        venue_name = None
        if user.venue_id:
            from models import Venue
            venue = db.query(Venue).filter(Venue.id == user.venue_id).first()
            if venue:
                venue_name = venue.name

        user_response = UserResponse(
            id=user.id,
            email=user.email,
            phone=user.phone,
            name=user.name,
            role=role_str,
            venue_id=user.venue_id,
            venue_name=venue_name,
            created_at=user.created_at
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=user_response
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/signup", response_model=TokenResponse)
@limiter.limit("3/hour")  # 3 signup attempts per hour per IP
def signup(request_data: SignupRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    """Sign up with email and password"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request_data.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    is_valid, error_message = validate_password_strength(request_data.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Server-side age validation (minimum 25 — strictest Indian state threshold)
    from datetime import date as date_type
    today = date_type.today()
    dob = request_data.date_of_birth
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    if age < 25:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be 25 or older to use this service"
        )
    
    # Create new user with hashed password
    hashed_password = hash_password(request_data.password)
    
    from datetime import datetime as dt, timezone as tz
    user = User(
        email=request_data.email,
        name=request_data.name,
        hashed_password=hashed_password,
        role="customer",
        date_of_birth=dob,
        terms_accepted_at=dt.now(tz.utc),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token and refresh token
    access_token = create_access_token(data={"sub": user.id, "role": "customer"})
    refresh_token = create_refresh_token(data={"sub": user.id, "role": "customer"})
    
    # Create session in database
    create_session(
        db=db,
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token
    )
    
    # Set HttpOnly cookies
    set_auth_cookies(response, access_token, refresh_token)

    # Send welcome email (non-blocking)
    try:
        send_welcome_email(user.email, user.name)
    except Exception as e:
        print(f"Welcome email failed: {e}")

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=user.name,
        role="customer",
        venue_id=user.venue_id,
        venue_name=None,
        date_of_birth=user.date_of_birth,
        terms_accepted_at=user.terms_accepted_at,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.post("/google", response_model=TokenResponse)
@limiter.limit("10/minute")  # 10 Google login attempts per minute per IP
def google_login(request_data: GoogleLoginRequest, request: Request, db: Session = Depends(get_db)):
    """Login with Google OAuth token"""
    # Verify Google token
    google_user = verify_google_token(request_data.token)
    
    if not google_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    # Extract user info
    google_id = google_user.get("sub")
    email = google_user.get("email")
    name = google_user.get("name", email.split("@")[0])
    
    # Check if user exists
    user = db.query(User).filter(User.google_id == google_id).first()
    
    if not user:
        # Create new user
        user = User(
            google_id=google_id,
            email=email,
            name=name
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/phone/send-otp")
@limiter.limit("3/hour")  # 3 OTP requests per hour per IP
def send_otp(request_data: PhoneSendOTPRequest, request: Request, db: Session = Depends(get_db)):
    """Send OTP to phone number"""
    # Create OTP
    otp = create_otp(db, request_data.phone)
    
    # Send OTP via SMS
    success = send_otp_sms(request_data.phone, otp.otp_code)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )
    
    response = {
        "success": True,
        "message": "OTP sent successfully",
        "expires_in_minutes": 5
    }

    return response


@router.post("/phone/verify-otp", response_model=TokenResponse)
@limiter.limit("5/minute")  # 5 OTP verification attempts per minute per IP
def verify_otp_endpoint(request_data: PhoneVerifyOTPRequest, request: Request, db: Session = Depends(get_db)):
    """Verify OTP and login"""
    # Verify OTP
    is_valid = verify_otp(db, request_data.phone, request_data.otp_code)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.phone == request_data.phone).first()
    
    if not user:
        # Create new user with phone
        user = User(
            phone=request_data.phone,
            name=f"User {request_data.phone[-4:]}",  # Default name
            role="customer"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Create access token and refresh token
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    
    access_token = create_access_token(data={"sub": user.id, "role": role_str})
    refresh_token = create_refresh_token(data={"sub": user.id, "role": role_str})
    
    # Create session in database
    create_session(
        db=db,
        user_id=user.id,
        access_token=access_token,
        refresh_token=refresh_token
    )
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=user.name,
        role=role_str,
        venue_id=user.venue_id,
        venue_name=None,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=user_response
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user profile"""
    # Get venue name if venue_id exists
    venue_name = None
    if current_user.venue_id:
        from models import Venue
        venue = db.query(Venue).filter(Venue.id == current_user.venue_id).first()
        if venue:
            venue_name = venue.name
            
    # Create response manually to include venue_name
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        phone=current_user.phone,
        name=current_user.name,
        role=str(current_user.role.value if hasattr(current_user.role, 'value') else current_user.role),
        venue_id=current_user.venue_id,
        venue_name=venue_name,
        created_at=current_user.created_at
    )


# ============ Session Management Endpoints ============

@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(request: RefreshTokenRequest, response: Response, db: Session = Depends(get_db)):
    """Refresh access token using refresh token"""
    # Get session by refresh token
    session = get_session_by_refresh_token(db, request.refresh_token)
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Create new tokens
    role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
    
    new_access_token = create_access_token(data={
        "sub": user.id,
        "role": role_str,
        "venue_id": user.venue_id
    })
    
    new_refresh_token = create_refresh_token(data={
        "sub": user.id,
        "role": role_str
    })
    
    # Update session with new tokens
    update_session_tokens(db, session.id, new_access_token, new_refresh_token)
    
    # Set new HttpOnly cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)
    
    # Get venue name
    venue_name = None
    if user.venue_id:
        from models import Venue
        venue = db.query(Venue).filter(Venue.id == user.venue_id).first()
        if venue:
            venue_name = venue.name
    
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        phone=user.phone,
        name=user.name,
        role=role_str,
        venue_id=user.venue_id,
        venue_name=venue_name,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=user_response
    )


@router.post("/logout")
def logout(request: RefreshTokenRequest, response: Response, db: Session = Depends(get_db)):
    """Logout and invalidate session"""
    invalidate_session(db, request.refresh_token)
    # Clear HttpOnly cookies
    clear_auth_cookies(response)
    return {"message": "Logged out successfully"}


@router.post("/logout-all")
def logout_all_devices(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout from all devices"""
    invalidate_all_user_sessions(db, current_user.id)
    # Clear HttpOnly cookies
    clear_auth_cookies(response)
    return {"message": "Logged out from all devices"}


@router.get("/sessions")
def get_user_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all active sessions for current user"""
    from models import UserSession
    
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).order_by(UserSession.last_activity.desc()).all()
    
    return {
        "sessions": [
            {
                "id": s.id,
                "device_info": s.device_info,
                "ip_address": s.ip_address,
                "last_activity": s.last_activity,
                "created_at": s.created_at,
                "expires_at": s.expires_at
            }
            for s in sessions
        ],
        "total": len(sessions)
    }



# ============ Password Reset Endpoints ============

@router.post("/forgot-password")
@limiter.limit("3/day")  # 3 password reset requests per day per IP
def forgot_password(request_data: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Request password reset - sends email with reset link"""
    # Find user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    # Always return success (don't reveal if email exists)
    if not user:
        return {
            "message": "If an account exists with this email, you will receive a password reset link.",
            "success": True
        }
    
    # Create reset token
    token = create_password_reset_token(db, user.id)
    
    # Send email
    send_password_reset_email(user.email, token, user.name)
    
    return {
        "message": "If an account exists with this email, you will receive a password reset link.",
        "success": True
    }


@router.post("/reset-password")
@limiter.limit("5/hour")  # 5 password reset attempts per hour per IP
def reset_password(request_data: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    """Reset password using token from email"""
    # Validate password strength
    from auth import validate_password_strength
    is_valid, error_message = validate_password_strength(request_data.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    
    # Verify and use token
    success = use_password_reset_token(db, request_data.token, request_data.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {
        "message": "Password reset successfully",
        "success": True
    }


@router.post("/verify-reset-token")
def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verify if a password reset token is valid"""
    user_id = verify_password_reset_token(db, token)
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {
        "valid": True,
        "message": "Token is valid"
    }


@router.post("/change-password")
def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change password for authenticated user"""
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    is_valid, msg = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    current_user.hashed_password = hash_password(request.new_password)
    db.commit()

    return {"message": "Password changed successfully"}
