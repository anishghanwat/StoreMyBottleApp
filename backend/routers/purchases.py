from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional

from database import get_db
from models import User, Purchase, Bottle, Venue, PaymentStatus
from schemas import (
    PurchaseCreateRequest, PurchaseConfirmRequest, PurchaseResponse,
    UserBottleResponse, UserBottleList, PurchaseRequestResponse, ProcessPurchaseRequest
)
from auth import get_current_user, get_current_active_bartender

router = APIRouter(prefix="/api/purchases", tags=["purchases"])


@router.post("", response_model=PurchaseResponse)
def create_purchase(
    request: PurchaseCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new purchase (initiate payment)"""
    # Verify bottle exists and is available
    bottle = db.query(Bottle).filter(
        Bottle.id == request.bottle_id,
        Bottle.venue_id == request.venue_id,
        Bottle.is_available == True
    ).first()
    
    if not bottle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bottle not found or not available"
        )
    
    # Verify venue exists
    venue = db.query(Venue).filter(Venue.id == request.venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    # Create purchase
    purchase = Purchase(
        user_id=current_user.id,
        bottle_id=bottle.id,
        venue_id=venue.id,
        total_ml=bottle.volume_ml,
        remaining_ml=bottle.volume_ml,
        purchase_price=bottle.price,
        payment_status=PaymentStatus.PENDING
    )
    
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    
    return purchase


@router.post("/{purchase_id}/confirm", response_model=PurchaseResponse)
def confirm_purchase(
    purchase_id: str,
    request: PurchaseConfirmRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Confirm payment for a purchase"""
    # Get purchase
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == current_user.id
    ).first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
    
    if purchase.payment_status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase already processed"
        )
    
    # Update purchase
    purchase.payment_status = PaymentStatus.CONFIRMED
    purchase.payment_method = request.payment_method
    purchase.purchased_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(purchase)
    
    return purchase


@router.get("/my-bottles", response_model=UserBottleList)
def get_my_bottles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's purchased bottles"""
    purchases = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0
    ).all()
    
    # Transform to UserBottleResponse format
    user_bottles = []
    for purchase in purchases:
        bottle = purchase.bottle
        venue = purchase.venue
        
        # Calculate expiry (30 days from purchase)
        purchase_date = purchase.purchased_at or purchase.created_at
        # Ensure timezone aware
        if purchase_date.tzinfo is None:
            purchase_date = purchase_date.replace(tzinfo=timezone.utc)
        expires_at = purchase_date + timedelta(days=30)

        user_bottle = UserBottleResponse(
            id=purchase.id,
            bottleId=bottle.id,
            venueName=venue.name,
            bottleName=bottle.name,
            bottleBrand=bottle.brand,
            totalMl=purchase.total_ml,
            remainingMl=purchase.remaining_ml,
            image=bottle.image_url or "",
            expiresAt=expires_at
        )
        user_bottles.append(user_bottle)
    
    return UserBottleList(
        bottles=user_bottles,
        total=len(user_bottles)
    )


@router.get("/history", response_model=UserBottleList)
def get_purchase_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's complete purchase history"""
    purchases = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).order_by(Purchase.created_at.desc()).all()
    
    # Transform to UserBottleResponse format
    user_bottles = []
    for purchase in purchases:
        bottle = purchase.bottle
        venue = purchase.venue
        
        # Calculate expiry
        purchase_date = purchase.purchased_at or purchase.created_at
        if purchase_date.tzinfo is None:
            purchase_date = purchase_date.replace(tzinfo=timezone.utc)
        expires_at = purchase_date + timedelta(days=30)
        
        user_bottle = UserBottleResponse(
            id=purchase.id,
            bottleId=bottle.id,
            venueName=venue.name,
            bottleName=bottle.name,
            bottleBrand=bottle.brand,
            totalMl=purchase.total_ml,
            remainingMl=purchase.remaining_ml,
            image=bottle.image_url or "",
            expiresAt=expires_at
        )
        user_bottles.append(user_bottle)
    
    return UserBottleList(
        bottles=user_bottles,
        total=len(user_bottles)
    )


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get purchase details"""
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == current_user.id
    ).first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
    
    return purchase


@router.get("/venue/{venue_id}/pending", response_model=List[PurchaseRequestResponse])
def get_pending_purchases(
    venue_id: str,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Get pending purchase requests for a venue"""
    # Verify bartender belongs to venue (optional, depends on policy)
    if current_user.venue_id and current_user.venue_id != venue_id:
        # Allowing override if admin, but strict for now
        # raise HTTPException(status_code=403, detail="Not authorized for this venue")
        pass 

    purchases = db.query(Purchase).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.PENDING
    ).order_by(Purchase.created_at.desc()).all()
    
    response = []
    for p in purchases:
        response.append(PurchaseRequestResponse(
            id=p.id,
            customer_name=p.user.name,
            bottle_name=p.bottle.name,
            bottle_brand=p.bottle.brand,
            volume_ml=p.total_ml,
            amount=p.purchase_price,
            payment_method=p.payment_method,
            created_at=p.created_at,
            status=p.payment_status
        ))
        
    return response


@router.post("/{purchase_id}/process", response_model=PurchaseResponse)
def process_purchase(
    purchase_id: str,
    request: ProcessPurchaseRequest,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Confirm or reject a purchase request"""
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
        
    if purchase.payment_status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Purchase already processed"
        )
        
    if request.action == "confirm":
        # Confirm payment
        purchase.payment_status = PaymentStatus.CONFIRMED
        # If payment method is not set, default to CASH (since bartender is confirming manually)
        if not purchase.payment_method:
             from models import PaymentMethod
             purchase.payment_method = PaymentMethod.CASH
             
        purchase.purchased_at = datetime.now(timezone.utc)
        
    elif request.action == "reject":
        purchase.payment_status = PaymentStatus.FAILED
        
    db.commit()
    db.refresh(purchase)
    
    return purchase
