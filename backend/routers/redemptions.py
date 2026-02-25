from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import json

from database import get_db
from models import User, Purchase, Redemption, RedemptionStatus, PaymentStatus
from schemas import (
    RedemptionCreateRequest, RedemptionResponse, QRValidationRequest,
    QRValidationResponse, RedemptionHistoryList, RedemptionHistoryItem
)
from auth import get_current_user, get_current_active_bartender, generate_qr_token

router = APIRouter(prefix="/api/redemptions", tags=["redemptions"])


@router.post("/generate-qr", response_model=RedemptionResponse)
def generate_redemption_qr(
    request: RedemptionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate QR code for peg redemption"""
    # Get purchase
    purchase = db.query(Purchase).filter(
        Purchase.id == request.purchase_id,
        Purchase.user_id == current_user.id,
        Purchase.payment_status == PaymentStatus.CONFIRMED
    ).first()
    
    if not purchase:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Purchase not found or not confirmed"
        )
    
    # Check if enough ml remaining
    if purchase.remaining_ml < request.peg_size_ml:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient volume. Only {purchase.remaining_ml} ml remaining"
        )
    
    # Validate peg size (30, 45, or 60 ml)
    if request.peg_size_ml not in [30, 45, 60]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid peg size. Must be 30, 45, or 60 ml"
        )
    
    
    # Check if bottle is expired (30 days)
    purchase_date = purchase.purchased_at or purchase.created_at
    if purchase_date.tzinfo is None:
        purchase_date = purchase_date.replace(tzinfo=timezone.utc)
        
    bottle_expiry = purchase_date + timedelta(days=30)
    
    if datetime.now(timezone.utc) > bottle_expiry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bottle has expired (valid for 30 days)"
        )

    # Generate QR token
    qr_token = generate_qr_token()
    qr_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Create redemption
    redemption = Redemption(
        purchase_id=purchase.id,
        user_id=current_user.id,
        venue_id=purchase.venue_id,
        peg_size_ml=request.peg_size_ml,
        qr_token=qr_token,
        qr_expires_at=qr_expires_at,
        status=RedemptionStatus.PENDING
    )
    
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    
    # Construct QR data JSON
    qr_data_dict = {
        "id": redemption.qr_token,
        "venue": purchase.venue.name,
        "bottle": f"{purchase.bottle.brand} {purchase.bottle.name}",
        "ml": request.peg_size_ml,
        "exp": qr_expires_at.isoformat(),
        "created": datetime.now(timezone.utc).isoformat()
    }
    
    return RedemptionResponse(
        id=redemption.id,
        purchase_id=redemption.purchase_id,
        peg_size_ml=redemption.peg_size_ml,
        qr_token=redemption.qr_token,
        qr_data=json.dumps(qr_data_dict),
        qr_expires_at=redemption.qr_expires_at,
        status=redemption.status,
        created_at=redemption.created_at
    )


@router.post("/validate", response_model=QRValidationResponse)
def validate_redemption_qr(
    request: QRValidationRequest,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Validate and redeem QR code (bartender endpoint)"""
    # Find redemption by token
    redemption = db.query(Redemption).filter(
        Redemption.qr_token == request.qr_token
    ).first()
    
    if not redemption:
        return QRValidationResponse(
            success=False,
            message="Invalid QR code"
        )
    
    # Check if already redeemed
    if redemption.status == RedemptionStatus.REDEEMED:
        return QRValidationResponse(
            success=False,
            message="QR code already used"
        )
    
    # Check if expired
    # Check if expired
    expiry = redemption.qr_expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if expiry < datetime.now(timezone.utc):
        redemption.status = RedemptionStatus.EXPIRED
        db.commit()
        return QRValidationResponse(
            success=False,
            message="QR code expired"
        )
    
    # Check if cancelled
    if redemption.status == RedemptionStatus.CANCELLED:
        return QRValidationResponse(
            success=False,
            message="QR code cancelled"
        )
    
    # Get purchase and update remaining ml with row locking to prevent race conditions
    purchase = db.query(Purchase).filter(Purchase.id == redemption.purchase_id).with_for_update().first()
    
    if not purchase:
        return QRValidationResponse(
            success=False,
            message="Purchase not found"
        )
    
    if purchase.remaining_ml < redemption.peg_size_ml:
        return QRValidationResponse(
            success=False,
            message="Insufficient volume in bottle"
        )
    
    # Double-check redemption status hasn't changed (race condition protection)
    db.refresh(redemption)
    if redemption.status != RedemptionStatus.PENDING:
        return QRValidationResponse(
            success=False,
            message=f"QR code status changed to {redemption.status.value}"
        )
    
    # Redeem - Update both records atomically
    purchase.remaining_ml -= redemption.peg_size_ml
    redemption.status = RedemptionStatus.REDEEMED
    redemption.redeemed_at = datetime.now(timezone.utc)
    redemption.redeemed_by_staff_id = current_user.id
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process redemption: {str(e)}"
        )
    
    db.refresh(redemption)
    
    try:
        # Reconstruct QR data for response (as it's not stored in DB)
        qr_data_dict = {
            "id": redemption.qr_token,
            "venue": purchase.venue.name,
            "bottle": f"{purchase.bottle.brand} {purchase.bottle.name}",
            "ml": redemption.peg_size_ml,
            "exp": redemption.qr_expires_at.isoformat(),
            "created": redemption.created_at.isoformat()
        }
        
        redemption_response = RedemptionResponse(
            id=redemption.id,
            purchase_id=redemption.purchase_id,
            peg_size_ml=redemption.peg_size_ml,
            qr_token=redemption.qr_token,
            qr_data=json.dumps(qr_data_dict),
            qr_expires_at=redemption.qr_expires_at,
            status=redemption.status,
            created_at=redemption.created_at,
            bottle_name=purchase.bottle.name,
            bottle_brand=purchase.bottle.brand,
            customer_name=purchase.user.name,
            remaining_ml=purchase.remaining_ml,
            total_ml=purchase.total_ml
        )
        
        return QRValidationResponse(
            success=True,
            message=f"Successfully redeemed {redemption.peg_size_ml} ml",
            redemption=redemption_response
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error constructing response: {str(e)}")


@router.get("/history", response_model=RedemptionHistoryList)
def get_redemption_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's redemption history"""
    redemptions = db.query(Redemption).filter(
        Redemption.user_id == current_user.id
    ).order_by(Redemption.created_at.desc()).all()
    
    # Transform to history items
    history_items = []
    for redemption in redemptions:
        purchase = redemption.purchase
        bottle = purchase.bottle
        venue = purchase.venue
        
        history_item = RedemptionHistoryItem(
            id=redemption.id,
            bottle_name=bottle.name,
            bottle_brand=bottle.brand,
            venue_name=venue.name,
            peg_size_ml=redemption.peg_size_ml,
            status=redemption.status,
            redeemed_at=redemption.redeemed_at,
            created_at=redemption.created_at
        )
        history_items.append(history_item)
    
    return RedemptionHistoryList(
        redemptions=history_items,
        total=len(history_items)
    )


@router.get("/venue/{venue_id}/recent", response_model=RedemptionHistoryList)
def get_venue_recent_redemptions(
    venue_id: str,
    limit: int = 10,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Get recent redemptions at a venue (bartender endpoint)"""
    # Verify bartender is assigned to this venue
    if current_user.venue_id != venue_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this venue's redemptions"
        )
    
    redemptions = db.query(Redemption).filter(
        Redemption.venue_id == venue_id,
        Redemption.status == RedemptionStatus.REDEEMED
    ).order_by(Redemption.redeemed_at.desc()).limit(limit).all()
    
    # Transform to history items
    history_items = []
    for redemption in redemptions:
        purchase = redemption.purchase
        bottle = purchase.bottle
        venue = purchase.venue
        user = purchase.user
        
        history_item = RedemptionHistoryItem(
            id=redemption.id,
            bottle_name=bottle.name,
            bottle_brand=bottle.brand,
            venue_name=venue.name,
            peg_size_ml=redemption.peg_size_ml,
            status=redemption.status,
            redeemed_at=redemption.redeemed_at,
            created_at=redemption.created_at,
            user_name=user.name
        )
        history_items.append(history_item)
    
    return RedemptionHistoryList(
        redemptions=history_items,
        total=len(history_items)
    )


@router.get("/{redemption_id}", response_model=RedemptionResponse)
def get_redemption(
    redemption_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get redemption details"""
    redemption = db.query(Redemption).filter(
        Redemption.id == redemption_id,
        Redemption.user_id == current_user.id
    ).first()
    
    if not redemption:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Redemption not found"
        )
    
    # Reconstruct QR data for response
    purchase = redemption.purchase
    qr_data_dict = {
        "id": redemption.qr_token,
        "venue": purchase.venue.name,
        "bottle": f"{purchase.bottle.brand} {purchase.bottle.name}",
        "ml": redemption.peg_size_ml,
        "exp": redemption.qr_expires_at.isoformat(),
        "created": redemption.created_at.isoformat()
    }
        
    return RedemptionResponse(
        id=redemption.id,
        purchase_id=redemption.purchase_id,
        peg_size_ml=redemption.peg_size_ml,
        qr_token=redemption.qr_token,
        qr_data=json.dumps(qr_data_dict),
        qr_expires_at=redemption.qr_expires_at,
        status=redemption.status,
        created_at=redemption.created_at,
        bottle_name=purchase.bottle.name,
        bottle_brand=purchase.bottle.brand,
        remaining_ml=purchase.remaining_ml,
        total_ml=purchase.total_ml
    )
