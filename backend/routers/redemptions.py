from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Optional
import json

from database import get_db
from models import User, Purchase, Redemption, RedemptionStatus, PaymentStatus, Venue
from schemas import (
    RedemptionCreateRequest, RedemptionResponse, QRValidationRequest,
    QRValidationResponse, RedemptionHistoryList, RedemptionHistoryItem
)
from auth import get_current_user, get_current_active_bartender, generate_qr_token, verify_qr_token_access, verify_venue_access, verify_redemption_ownership

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

    # Generate cryptographically secure QR token
    qr_token = generate_qr_token()
    
    # QR code expires in 15 minutes
    qr_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    # Create redemption with device binding
    redemption = Redemption(
        purchase_id=purchase.id,
        user_id=current_user.id,
        venue_id=purchase.venue_id,
        peg_size_ml=request.peg_size_ml,
        qr_token=qr_token,
        qr_expires_at=qr_expires_at,
        status=RedemptionStatus.PENDING,
        device_fingerprint=request.device_fingerprint  # SECURITY: Device binding
    )
    
    db.add(redemption)
    db.commit()
    db.refresh(redemption)
    
    # Construct QR data JSON with timestamp watermark
    current_time = datetime.now(timezone.utc)
    qr_data_dict = {
        "id": redemption.qr_token,
        "venue": purchase.venue.name,
        "bottle": f"{purchase.bottle.brand} {purchase.bottle.name}",
        "ml": request.peg_size_ml,
        "exp": qr_expires_at.isoformat(),
        "created": current_time.isoformat(),
        "timestamp": int(current_time.timestamp()),  # SECURITY: Unix timestamp watermark
        "device": request.device_fingerprint[:20] if request.device_fingerprint else None  # Partial fingerprint for display
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
    if redemption.status != RedemptionStatus.PENDING:
        return QRValidationResponse(
            success=False,
            message=f"QR code already {redemption.status.value}"
        )
    
    # Check expiration
    expiry = redemption.qr_expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)
        
    if expiry < datetime.now(timezone.utc):
        redemption.status = RedemptionStatus.EXPIRED
        db.commit()
        return QRValidationResponse(
            success=False,
            message="QR code has expired"
        )
    
    # AUTHORIZATION: Check venue access
    # Admin can redeem at any venue
    if current_user.role != "admin":
        # Bartender can only redeem at their venue
        if current_user.role == "bartender":
            if current_user.venue_id != redemption.venue_id:
                return QRValidationResponse(
                    success=False,
                    message=f"This QR code is for a different venue. You can only redeem at your assigned venue."
                )
        else:
            return QRValidationResponse(
                success=False,
                message="Not authorized to redeem QR codes"
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
    redemption.remaining_ml_after = purchase.remaining_ml  # snapshot at time of pour
    
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

        # Send redemption receipt email (non-blocking)
        try:
            from email_service import send_redemption_receipt_email
            customer = purchase.user
            if customer and customer.email:
                redeemed_at_str = redemption.redeemed_at.strftime("%d %b %Y, %I:%M %p") if redemption.redeemed_at else "Just now"
                send_redemption_receipt_email(
                    email=customer.email,
                    user_name=customer.name,
                    bottle_name=purchase.bottle.name,
                    bottle_brand=purchase.bottle.brand,
                    venue_name=purchase.venue.name,
                    peg_size_ml=redemption.peg_size_ml,
                    remaining_ml=purchase.remaining_ml,
                    redeemed_at=redeemed_at_str,
                )
        except Exception as e:
            print(f"Redemption receipt email failed: {e}")
        
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

    # Pre-fetch bartender names in one query
    staff_ids = [r.redeemed_by_staff_id for r in redemptions if r.redeemed_by_staff_id]
    staff_map: dict = {}
    if staff_ids:
        staff_users = db.query(User).filter(User.id.in_(staff_ids)).all()
        staff_map = {u.id: u.name for u in staff_users}

    history_items = []
    for redemption in redemptions:
        purchase = redemption.purchase
        bottle = purchase.bottle
        venue = purchase.venue

        history_items.append(RedemptionHistoryItem(
            id=redemption.id,
            bottle_name=bottle.name,
            bottle_brand=bottle.brand,
            venue_name=venue.name,
            peg_size_ml=redemption.peg_size_ml,
            status=redemption.status,
            redeemed_at=redemption.redeemed_at,
            created_at=redemption.created_at,
            bartender_name=staff_map.get(redemption.redeemed_by_staff_id) if redemption.redeemed_by_staff_id else None,
            remaining_ml_after=redemption.remaining_ml_after,
        ))

    return RedemptionHistoryList(
        redemptions=history_items,
        total=len(history_items)
    )


@router.get("/venue/{venue_id}/history", response_model=RedemptionHistoryList)
def get_venue_full_history(
    venue: Venue = Depends(verify_venue_access),
    status_filter: Optional[str] = None,
    limit: int = 200,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Get full redemption history at a venue with optional status filter (bartender endpoint)"""
    query = db.query(Redemption).filter(Redemption.venue_id == venue.id)
    if status_filter:
        try:
            query = query.filter(Redemption.status == RedemptionStatus(status_filter))
        except ValueError:
            pass
    redemptions = query.order_by(Redemption.created_at.desc()).limit(limit).all()

    history_items = []
    for redemption in redemptions:
        purchase = redemption.purchase
        bottle = purchase.bottle
        r_venue = purchase.venue
        user = purchase.user
        history_items.append(RedemptionHistoryItem(
            id=redemption.id,
            bottle_name=bottle.name,
            bottle_brand=bottle.brand,
            venue_name=r_venue.name,
            peg_size_ml=redemption.peg_size_ml,
            status=redemption.status,
            redeemed_at=redemption.redeemed_at,
            created_at=redemption.created_at,
            user_name=user.name
        ))

    return RedemptionHistoryList(redemptions=history_items, total=len(history_items))


@router.get("/venue/{venue_id}/recent", response_model=RedemptionHistoryList)
def get_venue_recent_redemptions(
    venue: Venue = Depends(verify_venue_access),
    limit: int = 10,
    current_user: User = Depends(get_current_active_bartender),
    db: Session = Depends(get_db)
):
    """Get recent redemptions at a venue (bartender endpoint)"""
    redemptions = db.query(Redemption).filter(
        Redemption.venue_id == venue.id,
        Redemption.status == RedemptionStatus.REDEEMED
    ).order_by(Redemption.redeemed_at.desc()).limit(limit).all()

    history_items = []
    for redemption in redemptions:
        purchase = redemption.purchase
        bottle = purchase.bottle
        r_venue = purchase.venue
        user = purchase.user

        history_items.append(RedemptionHistoryItem(
            id=redemption.id,
            bottle_name=bottle.name,
            bottle_brand=bottle.brand,
            venue_name=r_venue.name,
            peg_size_ml=redemption.peg_size_ml,
            status=redemption.status,
            redeemed_at=redemption.redeemed_at,
            created_at=redemption.created_at,
            user_name=user.name,
        ))

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
