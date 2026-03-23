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
from auth import get_current_user, get_current_active_bartender, verify_purchase_ownership, verify_venue_access

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
    # Get purchase with row lock
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == current_user.id
    ).with_for_update().first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
    
    if purchase.payment_status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Purchase already processed with status: {purchase.payment_status.value}"
        )
    
    # Update purchase atomically
    purchase.payment_status = PaymentStatus.CONFIRMED
    purchase.payment_method = request.payment_method
    purchase.purchased_at = datetime.now(timezone.utc)
    purchase.expires_at = purchase.purchased_at + timedelta(days=30)
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to confirm purchase: {str(e)}"
        )
    
    db.refresh(purchase)
    
    # Decrement stock_count and notify admin if depleted (non-blocking)
    try:
        bottle = purchase.bottle
        if bottle.stock_count is not None:
            bottle.stock_count = max(0, bottle.stock_count - 1)
            if bottle.stock_count == 0:
                bottle.is_available = False
                db.commit()
                try:
                    from email_service import send_stock_depleted_email
                    venue = purchase.venue
                    send_stock_depleted_email(
                        bottle_name=bottle.name,
                        bottle_brand=bottle.brand,
                        venue_name=venue.name,
                    )
                except Exception as e:
                    print(f"Stock depleted email failed: {e}")
            else:
                db.commit()
    except Exception as e:
        print(f"Stock count update failed: {e}")

    # Send purchase confirmation email (non-blocking)
    try:
        from email_service import send_purchase_confirmation_email
        from datetime import timedelta
        user = db.query(User).filter(User.id == purchase.user_id).first()
        if user and user.email:
            bottle = purchase.bottle
            venue = purchase.venue
            purchase_date = purchase.purchased_at or purchase.created_at
            if purchase_date.tzinfo is None:
                purchase_date = purchase_date.replace(tzinfo=timezone.utc)
            expires_at = (purchase_date + timedelta(days=30)).strftime("%d %b %Y")
            send_purchase_confirmation_email(
                email=user.email,
                user_name=user.name,
                bottle_name=bottle.name,
                bottle_brand=bottle.brand,
                venue_name=venue.name,
                amount=str(purchase.purchase_price),
                volume_ml=purchase.total_ml,
                expires_at=expires_at,
                purchase_id=purchase.id,
            )
    except Exception as e:
        print(f"Purchase confirmation email failed: {e}")

    return purchase


@router.post("/{purchase_id}/cancel", response_model=PurchaseResponse)
def cancel_purchase(
    purchase_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a pending purchase"""
    # Get purchase with row lock
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id,
        Purchase.user_id == current_user.id
    ).with_for_update().first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
    
    if purchase.payment_status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel purchase with status: {purchase.payment_status.value}"
        )
    
    # Mark as failed/cancelled
    purchase.payment_status = PaymentStatus.FAILED
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to cancel purchase: {str(e)}"
        )
    
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


@router.get("/pending", response_model=List[PurchaseResponse])
def get_pending_purchases(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's pending purchases (waiting for payment confirmation)
    
    Only returns purchases that are:
    - Still pending (not confirmed/failed)
    - Created within the last 15 minutes
    """
    # Calculate expiration time (15 minutes ago)
    expiration_time = datetime.now(timezone.utc) - timedelta(minutes=15)
    
    purchases = db.query(Purchase).filter(
        Purchase.user_id == current_user.id,
        Purchase.payment_status == PaymentStatus.PENDING,
        Purchase.created_at >= expiration_time  # Only show purchases from last 15 minutes
    ).order_by(Purchase.created_at.desc()).all()
    
    return purchases


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
            expiresAt=expires_at,
            purchasePrice=purchase.purchase_price,
            purchasedAt=purchase.purchased_at or purchase.created_at
        )
        user_bottles.append(user_bottle)
    
    return UserBottleList(
        bottles=user_bottles,
        total=len(user_bottles)
    )


@router.get("/{purchase_id}", response_model=PurchaseResponse)
def get_purchase(
    purchase: Purchase = Depends(verify_purchase_ownership),
    db: Session = Depends(get_db)
):
    """Get purchase details"""
    return purchase


@router.get("/venue/{venue_id}/pending", response_model=List[PurchaseRequestResponse])
def get_pending_purchases_for_venue(
    venue: Venue = Depends(verify_venue_access),
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Get pending purchase requests for a venue
    
    Only returns purchases that are:
    - Still pending (not confirmed/failed)
    - Created within the last 15 minutes
    """
    # Calculate expiration time (15 minutes ago)
    expiration_time = datetime.now(timezone.utc) - timedelta(minutes=15)

    purchases = db.query(Purchase).filter(
        Purchase.venue_id == venue.id,
        Purchase.payment_status == PaymentStatus.PENDING,
        Purchase.created_at >= expiration_time  # Only show purchases from last 15 minutes
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
    # Get purchase with row lock
    purchase = db.query(Purchase).filter(
        Purchase.id == purchase_id
    ).with_for_update().first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found"
        )
        
    if purchase.payment_status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Purchase already processed with status: {purchase.payment_status.value}"
        )
        
    if request.action == "confirm":
        # Confirm payment
        purchase.payment_status = PaymentStatus.CONFIRMED
        # If payment method is not set, default to CASH (since bartender is confirming manually)
        if not purchase.payment_method:
             from models import PaymentMethod
             purchase.payment_method = PaymentMethod.CASH
             
        purchase.purchased_at = datetime.now(timezone.utc)
        purchase.expires_at = purchase.purchased_at + timedelta(days=30)
        
    elif request.action == "reject":
        purchase.payment_status = PaymentStatus.FAILED
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be 'confirm' or 'reject'"
        )
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process purchase: {str(e)}"
        )
    
    db.refresh(purchase)

    # Decrement stock_count and notify admin if depleted (non-blocking)
    if request.action == "confirm":
        try:
            bottle = purchase.bottle
            if bottle.stock_count is not None:
                bottle.stock_count = max(0, bottle.stock_count - 1)
                if bottle.stock_count == 0:
                    bottle.is_available = False
                    db.commit()
                    try:
                        from email_service import send_stock_depleted_email
                        venue = purchase.venue
                        send_stock_depleted_email(
                            bottle_name=bottle.name,
                            bottle_brand=bottle.brand,
                            venue_name=venue.name,
                        )
                    except Exception as e:
                        print(f"Stock depleted email failed: {e}")
                else:
                    db.commit()
        except Exception as e:
            print(f"Stock count update failed: {e}")

    # Send purchase confirmation email when bartender confirms (non-blocking)
    if request.action == "confirm":
        try:
            from email_service import send_purchase_confirmation_email
            user = db.query(User).filter(User.id == purchase.user_id).first()
            if user and user.email:
                bottle = purchase.bottle
                venue = purchase.venue
                purchase_date = purchase.purchased_at or purchase.created_at
                if purchase_date.tzinfo is None:
                    purchase_date = purchase_date.replace(tzinfo=timezone.utc)
                expires_at = (purchase_date + timedelta(days=30)).strftime("%d %b %Y")
                send_purchase_confirmation_email(
                    email=user.email,
                    user_name=user.name,
                    bottle_name=bottle.name,
                    bottle_brand=bottle.brand,
                    venue_name=venue.name,
                    amount=str(purchase.purchase_price),
                    volume_ml=purchase.total_ml,
                    expires_at=expires_at,
                    purchase_id=purchase.id,
                )
        except Exception as e:
            print(f"Purchase confirmation email failed: {e}")

    return purchase
