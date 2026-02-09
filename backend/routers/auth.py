from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from config import settings
from models import User
from schemas import (
    LoginRequest, SignupRequest,
    GoogleLoginRequest, PhoneSendOTPRequest, PhoneVerifyOTPRequest,
    TokenResponse, UserResponse
)
from auth import (
    create_access_token, verify_google_token, create_otp, verify_otp,
    send_otp_sms, get_current_user, pwd_context
)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login with email and password"""
    try:
        print(f"LOGIN ATTEMPT: {request.email}, pwd_len={len(request.password)}")
        # Find user by email
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check password
        if not user.hashed_password or not pwd_context.verify(request.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create access token
        # Include role and venue_id in token (optional, but good for frontend decoding)
        # Ensure role is string (handle Enum)
        role_str = user.role.value if hasattr(user.role, 'value') else str(user.role)
        
        access_token = create_access_token(data={
            "sub": user.id,
            "role": role_str,
            "venue_id": user.venue_id
        })
        
        # Manually construct user response to avoid Pydantic validation issues with SQLAlchemy objects
        user_role = user.role.value if hasattr(user.role, 'value') else str(user.role)
        
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
            role=user_role,
            venue_id=user.venue_id,
            venue_name=venue_name,
            created_at=user.created_at
        )
        
        return TokenResponse(
            access_token=access_token,
            user=user_response
        )
    except HTTPException as he:
        # Re-raise HTTP exceptions as-is
        raise he
    except Exception as e:
        print(f"LOGIN ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return generic error if something breaks, but log it
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/signup", response_model=TokenResponse)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Sign up with email and password"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with hashed password
    hashed_password = pwd_context.hash(request.password)
    
    user = User(
        email=request.email,
        name=request.name,
        hashed_password=hashed_password,
        role="customer"  # Default role
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


@router.post("/google", response_model=TokenResponse)
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Login with Google OAuth token"""
    # Verify Google token
    google_user = verify_google_token(request.token)
    
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
def send_otp(request: PhoneSendOTPRequest, db: Session = Depends(get_db)):
    """Send OTP to phone number"""
    # Create OTP
    otp = create_otp(db, request.phone)
    
    # Send OTP via SMS
    success = send_otp_sms(request.phone, otp.otp_code)
    
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

    try:
        if settings.ENVIRONMENT == "development":
            response["debug_otp"] = otp.otp_code
    except Exception as e:
        print(f"ERROR ADDING DEBUG OTP: {e}")
    
    return response


@router.post("/phone/verify-otp", response_model=TokenResponse)
def verify_otp_endpoint(request: PhoneVerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP and login"""
    # Verify OTP
    is_valid = verify_otp(db, request.phone, request.otp_code)
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired OTP"
        )
    
    # Check if user exists
    user = db.query(User).filter(User.phone == request.phone).first()
    
    if not user:
        # Create new user with phone
        user = User(
            phone=request.phone,
            name=f"User {request.phone[-4:]}"  # Default name
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
