from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from database import get_db
from models import User, Purchase, Redemption, PaymentStatus, RedemptionStatus
from schemas import ProfileResponse, ProfileUpdateRequest, UserResponse
from auth import get_current_user

router = APIRouter(prefix="/api/profile", tags=["profile"])


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
    
    return ProfileResponse(
        user=UserResponse.model_validate(current_user),
        total_bottles=total_bottles,
        total_spent=total_spent,
        total_redemptions=total_redemptions
    )


@router.put("", response_model=UserResponse)
def update_profile(
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if request.name:
        current_user.name = request.name
    
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
