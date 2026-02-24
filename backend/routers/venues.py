from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from database import get_db
from models import Venue, Bottle, Purchase, PaymentStatus
from schemas import (
    VenueResponse, VenueList, BottleResponse, BottleList, VenueStatsResponse
)

router = APIRouter(prefix="/api/venues", tags=["venues"])


@router.get("", response_model=VenueList)
def get_venues(
    skip: int = 0, 
    limit: int = 20, 
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get list of venues"""
    query = db.query(Venue)
    
    if search:
        query = query.filter(Venue.name.ilike(f"%{search}%"))
        
    total = query.count()
    venues = query.offset(skip).limit(limit).all()
    
    return VenueList(venues=venues, total=total)


@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(venue_id: str, db: Session = Depends(get_db)):
    """Get venue details"""
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    return venue


@router.get("/{venue_id}/bottles", response_model=BottleList)
def get_venue_bottles(
    venue_id: str, 
    skip: int = 0, 
    limit: int = 50,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get bottles available at a venue"""
    # check venue exists
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
        
    query = db.query(Bottle).filter(
        Bottle.venue_id == venue_id,
        Bottle.is_available == True
    )
    
    if category:
        # If we had categories, filter here. For now, name search?
        pass
        
    total = query.count()
    bottles = query.offset(skip).limit(limit).all()
    
    return BottleList(bottles=bottles, total=total)


@router.get("/{venue_id}/stats", response_model=VenueStatsResponse)
def get_venue_stats(venue_id: str, db: Session = Depends(get_db)):
    """Get venue statistics (active bottles, served today)"""
    # Active bottles stored by users at this venue
    active_bottles = db.query(Purchase).filter(
        Purchase.venue_id == venue_id,
        Purchase.payment_status == PaymentStatus.CONFIRMED,
        Purchase.remaining_ml > 0
    ).count()
    
    # Served today (redemptions) implementation requires Redemption model join?
    # Or just count purchases today?
    # Let's count "served" as redemptions today.
    # Note: Redemption model needs to be imported if we use it.
    from models import Redemption, RedemptionStatus
    from datetime import datetime, time
    
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    
    served_today = db.query(Redemption).filter(
        Redemption.venue_id == venue_id,
        Redemption.status == RedemptionStatus.REDEEMED,
        Redemption.redeemed_at >= today_start
    ).count()
    
    return VenueStatsResponse(
        served_today=served_today,
        active_bottles=active_bottles
    )


@router.get("/{venue_id}/promotions")
def get_venue_promotions(
    venue_id: str,
    limit: int = 5,
    db: Session = Depends(get_db)
):
    """Get active promotions for a venue (public endpoint)"""
    from models import Promotion, PromotionStatus
    from datetime import datetime
    
    # Check venue exists
    venue = db.query(Venue).filter(Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Venue not found"
        )
    
    # Get active promotions for this venue or global promotions
    now = datetime.utcnow()
    promotions = db.query(Promotion).filter(
        Promotion.status == PromotionStatus.ACTIVE,
        Promotion.valid_from <= now,
        Promotion.valid_until >= now,
        (Promotion.venue_id == venue_id) | (Promotion.venue_id == None)
    ).limit(limit).all()
    
    result = []
    for promo in promotions:
        result.append({
            "id": promo.id,
            "code": promo.code,
            "description": promo.description,
            "discount_type": promo.type.value,
            "discount_value": promo.discount_value,
            "valid_from": promo.valid_from.isoformat(),
            "valid_until": promo.valid_until.isoformat(),
            "venue_id": promo.venue_id
        })
    
    return {
        "promotions": result,
        "total": len(result)
    }

