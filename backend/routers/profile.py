from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from decimal import Decimal
from typing import List, Optional
import cloudinary
import cloudinary.uploader
import os

from database import get_db
from models import User, Purchase, Redemption, PaymentStatus, RedemptionStatus, Bottle, Venue
from schemas import ProfileResponse, ProfileUpdateRequest, UserResponse
from auth import get_current_user, get_current_active_bartender

router = APIRouter(prefix="/api/profile", tags=["profile"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True,
)


@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user profile with statistics"""
    # Count total bottles (confirmed purchases with remaining ml)
    total_bottles = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0
    ).count()
    
    # Calculate total spent
    total_spent = db.query(func.sum(Purchase.purchase_price)).filter(
        Purchase.user_id == current_user.id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).scalar() or Decimal(0)
    
    # Count total redemptions
    total_redemptions = db.query(Redemption).filter(
        Redemption.user_id == current_user.id,
        Redemption.status == RedemptionStatus.REDEEMED
    ).count()

    # Sum actual ml consumed from real peg sizes
    total_ml_consumed = db.query(func.sum(Redemption.peg_size_ml)).filter(
        Redemption.user_id == current_user.id,
        Redemption.status == RedemptionStatus.REDEEMED
    ).scalar() or 0
    
    return ProfileResponse(
        user=UserResponse.model_validate(current_user),
        total_bottles=total_bottles,
        total_spent=total_spent,
        total_redemptions=total_redemptions,
        total_ml_consumed=total_ml_consumed
    )


@router.put("", response_model=UserResponse)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if request.name:
        import re
        name = request.name.strip()
        if len(name) < 2 or len(name) > 50:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name must be between 2 and 50 characters")
        if not re.match(r'^[a-zA-Z\s]+$', name):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Name can only contain letters")
        current_user.name = name
    
    if request.email and request.email != current_user.email:
        # Check if email is already taken
        existing = db.query(User).filter(User.email == request.email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = request.email
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.model_validate(current_user)


@router.post("/upload-avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile avatar to Cloudinary"""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Limit file size to 5MB
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 5MB")

    try:
        result = cloudinary.uploader.upload(
            contents,
            folder="storemybottle/avatars",
            public_id=f"user_{current_user.id}",
            overwrite=True,
            transformation=[{"width": 400, "height": 400, "crop": "fill", "gravity": "face"}],
        )
        current_user.profile_image_url = result["secure_url"]
        db.commit()
        db.refresh(current_user)
        return UserResponse.model_validate(current_user)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to upload image")


@router.get("/search", response_model=List[UserResponse])
def search_customers(
    q: str,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Search customers by name, phone, or email (bartender endpoint)"""
    if not q or len(q.strip()) < 2:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Search query must be at least 2 characters")

    term = f"%{q.strip()}%"
    users = db.query(User).filter(
        User.role == "customer",
        or_(
            User.name.ilike(term),
            User.phone.ilike(term),
            User.email.ilike(term),
        )
    ).limit(10).all()

    if not users:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No customers found")

    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}/bottles")
def get_user_bottles(
    user_id: str,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Get active bottles for a customer (bartender endpoint)"""
    user = db.query(User).filter(User.id == user_id, User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    purchases = db.query(Purchase).filter(
        Purchase.user_id == user_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0
    ).all()

    result = []
    for p in purchases:
        bottle: Bottle = p.bottle
        venue: Venue = p.venue
        result.append({
            "id": p.id,
            "bottle_name": bottle.name,
            "bottle_brand": bottle.brand,
            "venue_name": venue.name,
            "total_ml": p.total_ml,
            "remaining_ml": p.remaining_ml,
            "image_url": bottle.image_url,
        })

    return result
